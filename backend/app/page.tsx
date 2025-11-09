import Link from "next/link";
import { Card, Header } from "@/components/ui";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <Card className="max-w-md w-full">
        <Header className="text-center">AI Front Desk</Header>
        <p className="text-sm text-gray-600 mb-6 text-center">
          Hackathon prototype – choose a view:
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/demo"
            className="border rounded-md px-4 py-2 text-sm font-medium text-center hover:bg-gray-50"
          >
            Demo (customer view)
          </Link>
          <Link
            href="/owner"
            className="border rounded-md px-4 py-2 text-sm font-medium text-center hover:bg-gray-50"
          >
            Owner dashboard
          </Link>
        </div>
      </Card>
    </main>
  );
}
