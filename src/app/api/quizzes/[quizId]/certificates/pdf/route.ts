import { NextRequest } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { canManageQuiz } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

function parseQuizId(rawQuizId: string) {
  try {
    return BigInt(rawQuizId);
  } catch {
    return null;
  }
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function createSimplePdf(linesPerPage: string[][]) {
  const objects: string[] = [];

  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");

  const kids = linesPerPage.map((_, index) => `${3 + index * 2} 0 R`).join(" ");
  objects.push(`2 0 obj\n<< /Type /Pages /Count ${linesPerPage.length} /Kids [ ${kids} ] >>\nendobj`);

  linesPerPage.forEach((lines, index) => {
    const pageObjectNumber = 3 + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;

    const contentLines = [
      "BT",
      "/F1 28 Tf",
      "72 760 Td",
      `(${escapePdfText(lines[0] ?? "Qez Certificate")}) Tj`,
      "/F1 16 Tf"
    ];

    lines.slice(1).forEach((line, lineIndex) => {
      contentLines.push(`0 -${lineIndex === 0 ? 42 : 24} Td`);
      contentLines.push(`(${escapePdfText(line)}) Tj`);
    });
    contentLines.push("ET");

    const contentStream = contentLines.join("\n");

    objects.push(
      `${pageObjectNumber} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${3 + linesPerPage.length * 2} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>\nendobj`
    );
    objects.push(
      `${contentObjectNumber} 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj`
    );
  });

  const fontObjectNumber = 3 + linesPerPage.length * 2;
  objects.push(`${fontObjectNumber} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf-8");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const user = await getAuthUserFromRequest(request);

    if (!user) {
      return new Response("Unauthorized.", { status: 401 });
    }

    const resolvedParams = await params;
    const quizId = parseQuizId(resolvedParams.quizId);

    if (!quizId) {
      return new Response("Invalid quiz id.", { status: 400 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        title: true,
        ownerId: true
      }
    });

    if (!quiz) {
      return new Response("Quiz not found.", { status: 404 });
    }

    if (!canManageQuiz(user.role, quiz.ownerId, user.id)) {
      return new Response("Forbidden.", { status: 403 });
    }

    const attempts = await prisma.attempt.findMany({
      where: {
        quizId,
        status: {
          in: ["SUBMITTED", "AUTO_SUBMITTED"]
        }
      },
      orderBy: [{ totalScore: "desc" }, { totalTimeSeconds: "asc" }, { submittedAt: "asc" }],
      take: 3,
      select: {
        totalScore: true,
        totalTimeSeconds: true,
        user: {
          select: {
            name: true
          }
        }
      }
    });

    const pages =
      attempts.length > 0
        ? attempts.map((attempt, index) => [
            "Qez Winner Certificate",
            `${attempt.user.name}`,
            `Recognized for Rank #${index + 1} in ${quiz.title}`,
            `Score: ${attempt.totalScore}`,
            `Total time: ${attempt.totalTimeSeconds} seconds`,
            `Generated on ${new Date().toLocaleDateString("en-IN")}`
          ])
        : [[
            "Qez Winner Certificate",
            "No winners available yet",
            `Quiz: ${quiz.title}`,
            "Once valid submissions arrive, certificates will be generated here."
          ]];

    const pdfBuffer = createSimplePdf(pages);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="qez-certificates-${quiz.id.toString()}.pdf"`
      }
    });
  } catch (error) {
    console.error("certificate pdf error", error);
    return new Response("Unable to generate certificate PDF.", { status: 500 });
  }
}
