import {
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination-root";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
}: PaginationProps) {
  // Generate page numbers to show
  const generatePagination = () => {
    // Always show first and last page
    const firstPage = 1;
    const lastPage = totalPages;

    // Calculate range around current page
    const leftSiblingIndex = Math.max(page - siblingCount, firstPage);
    const rightSiblingIndex = Math.min(page + siblingCount, lastPage);

    // Determine if we need to show ellipsis
    const shouldShowLeftDots = leftSiblingIndex > firstPage + 1;
    const shouldShowRightDots = rightSiblingIndex < lastPage - 1;

    // Generate the actual array of numbers
    const pageNumbers: Array<number | string> = [];

    // Always add first page
    if (firstPage !== leftSiblingIndex) {
      pageNumbers.push(firstPage);
    }

    // Add ellipsis if needed
    if (shouldShowLeftDots) {
      pageNumbers.push("left-ellipsis");
    }

    // Add pages in the middle
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      pageNumbers.push(i);
    }

    // Add ellipsis if needed
    if (shouldShowRightDots) {
      pageNumbers.push("right-ellipsis");
    }

    // Always add last page
    if (lastPage !== rightSiblingIndex) {
      pageNumbers.push(lastPage);
    }

    return pageNumbers;
  };

  const pages = generatePagination();

  return (
    <PaginationRoot>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => page > 1 && onPageChange(page - 1)}
            className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>

        {pages.map((pageNumber, i) => {
          if (typeof pageNumber === "string") {
            return (
              <PaginationItem key={`${pageNumber}-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }

          return (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                onClick={() => onPageChange(pageNumber)}
                isActive={pageNumber === page}
                className="cursor-pointer"
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        <PaginationItem>
          <PaginationNext
            onClick={() => page < totalPages && onPageChange(page + 1)}
            className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  );
}
