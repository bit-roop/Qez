"use client";

import { ComponentPropsWithoutRef, ReactNode } from "react";
import { HTMLMotionProps, motion, useReducedMotion } from "framer-motion";

type MotionPageProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
};

type MotionSectionProps = HTMLMotionProps<"section"> & {
  children: ReactNode;
};

type MotionDivProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
};

export function MotionPage({ children, className, ...rest }: MotionPageProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className={className} {...(rest as ComponentPropsWithoutRef<"div">)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={className}
      initial={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function MotionSection({ children, className, ...rest }: MotionSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <section className={className} {...(rest as ComponentPropsWithoutRef<"section">)}>
        {children}
      </section>
    );
  }

  return (
    <motion.section
      className={className}
      initial={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true, margin: "-8% 0px -8% 0px" }}
      whileInView={{ opacity: 1, y: 0 }}
      {...rest}
    >
      {children}
    </motion.section>
  );
}

export function MotionStagger({ children, className, ...rest }: MotionDivProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className={className} {...(rest as ComponentPropsWithoutRef<"div">)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      animate="show"
      className={className}
      initial="hidden"
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: 0.08,
            delayChildren: 0.04
          }
        }
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function MotionItem({ children, className, ...rest }: MotionDivProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className={className} {...(rest as ComponentPropsWithoutRef<"div">)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1]
          }
        }
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
