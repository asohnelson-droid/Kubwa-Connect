import { twMerge } from 'tailwind-merge';

/**
 * Joins class names and resolves Tailwind conflicts so the LAST class wins
 * (e.g. a Card's default `bg-white` gives way to a passed `bg-kubwa-ink`).
 * Without this, which class wins depends on stylesheet order, which differs
 * between builds.
 */
export const cn = (...classes: Array<string | false | null | undefined>) =>
  twMerge(classes.filter(Boolean).join(' '));
