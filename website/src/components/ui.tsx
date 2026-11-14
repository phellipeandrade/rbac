import React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import clsx from 'clsx';

export function Button({variant = 'primary', className, ...props}: React.ButtonHTMLAttributes<HTMLButtonElement> & {variant?: 'primary' | 'secondary' | 'subtle'}) {
  return <button className={clsx('rb-button', `rb-button--${variant}`, className)} {...props} />;
}

export function Card({className, ...props}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('rb-card', className)} {...props} />;
}

export function Field({label, children, className}: {label: string; children: React.ReactNode; className?: string}) {
  return <label className={clsx('rb-field', className)}><span>{label}</span>{children}</label>;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx('rb-input', props.className)} {...props} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={clsx('rb-input', 'rb-select', props.className)} {...props} />;
}

export const Tabs = TabsPrimitive.Root;
export const TabsList = TabsPrimitive.List;
export const TabsTrigger = TabsPrimitive.Trigger;
export const TabsContent = TabsPrimitive.Content;
