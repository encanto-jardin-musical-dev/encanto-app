'use client';

import { Button, Link } from '@heroui/react';

type BackToFeedButtonProps = {
  label: string;
};

export default function BackToFeedButton({ label }: BackToFeedButtonProps) {
  return (
    <Button as={Link} href="/feed" color="primary" variant="solid">
      {label}
    </Button>
  );
}
