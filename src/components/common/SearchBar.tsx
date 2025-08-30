'use client';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { Input } from '@heroui/react';
import { useState } from 'react';

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <Input
      placeholder="Search"
      isClearable
      type="search"
      startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
      variant="bordered"
      value={searchQuery}
      onValueChange={setSearchQuery}
      onClear={() => setSearchQuery('')}
    />
  );
}
