/**
 * Lightweight reusable skeleton loading components
 */

// Table row skeleton for owner dashboard
export function TableRowSkeleton() {
  return (
    <tr className="border-t border-zinc-200 dark:border-zinc-800">
      <td className="px-3 py-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
      </td>
      <td className="px-3 py-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
      </td>
      <td className="px-3 py-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
      </td>
      <td className="px-3 py-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-40"></div>
      </td>
      <td className="px-3 py-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
      </td>
      <td className="px-3 py-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
      </td>
    </tr>
  );
}

// Table skeleton with multiple rows
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </>
  );
}

// Chat bubble skeleton for demo page (AI reply)
export function ChatBubbleSkeleton() {
  // Vary width slightly for more natural appearance
  const widths = ["w-48", "w-56", "w-64", "w-52"];
  const randomWidth = widths[Math.floor(Math.random() * widths.length)];
  
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-lg px-3 py-2 bg-gray-200 dark:bg-neutral-800 space-y-2">
        <div className={`h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse ${randomWidth}`}></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-32"></div>
      </div>
    </div>
  );
}
