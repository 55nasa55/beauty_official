'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface MessagesToolbarProps {
  page: number;
  limit: number;
  search: string;
  filter: string;
  sort: string;
  totalCount: number;
}

export default function MessagesToolbar({
  page,
  limit,
  search,
  filter,
  sort,
  totalCount,
}: MessagesToolbarProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(search);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  const totalPages = Math.ceil(totalCount / limit);
  const isFirstPage = page === 1;
  const isLastPage = page >= totalPages || totalPages === 0;

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const updateQueryParams = (updates: Record<string, string | number>) => {
    const params = new URLSearchParams();

    // Set defaults
    const currentParams = {
      page: page.toString(),
      limit: limit.toString(),
      search: search,
      filter: filter,
      sort: sort,
      ...updates,
    };

    // Only add non-default values
    if (currentParams.page !== '1') params.set('page', currentParams.page);
    if (currentParams.limit !== '20') params.set('limit', currentParams.limit);
    if (currentParams.search) params.set('search', currentParams.search);
    if (currentParams.filter !== 'all') params.set('filter', currentParams.filter);
    if (currentParams.sort !== 'newest') params.set('sort', currentParams.sort);

    const queryString = params.toString();
    router.push(`/admin/dashboard/messages${queryString ? '?' + queryString : ''}`);
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);

    // Clear existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Set new timeout for debounce
    const timeout = setTimeout(() => {
      updateQueryParams({ search: value, page: 1 });
    }, 500);

    setDebounceTimeout(timeout);
  };

  const handleFilterChange = (value: string) => {
    updateQueryParams({ filter: value, page: 1 });
  };

  const handleSortChange = (value: string) => {
    updateQueryParams({ sort: value, page: 1 });
  };

  const handlePreviousPage = () => {
    if (!isFirstPage) {
      updateQueryParams({ page: page - 1 });
    }
  };

  const handleNextPage = () => {
    if (!isLastPage) {
      updateQueryParams({ page: page + 1 });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search messages..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter */}
        <Select value={filter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Messages</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {totalCount > 0 ? (
            <>
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, totalCount)} of {totalCount} messages
            </>
          ) : (
            'No messages found'
          )}
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={isFirstPage}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <span className="text-sm text-gray-600">
            Page {page} of {Math.max(1, totalPages)}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={isLastPage}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
