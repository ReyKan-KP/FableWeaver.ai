import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Eye, MessageSquare, Users, BookText, MoreVertical, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteNovelDialog } from "./DeleteNovelDialog";
import { NovelStatusManager } from "./NovelStatusManager";

interface Novel {
  id: string;
  title: string;
  description: string;
  cover_image: string | null;
  status: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  userData?: {
    user_name: string | null;
    avatar_url: string | null;
  };
  viewCount: number;
  commentCount: number;
  collaboratorCount: number;
  publishedChapters: number;
  totalChapters: number;
}

interface NovelTableProps {
  novels: Novel[];
}

type SortField = "title" | "author" | "status" | "chapters" | "views" | "comments" | "created";
type SortOrder = "asc" | "desc";

export function NovelTable({ novels: initialNovels }: NovelTableProps) {
  const [novels, setNovels] = useState(initialNovels);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  
  // Filter and sort novels
  const filteredNovels = novels
    .filter((novel) => {
      const matchesSearch = novel.title.toLowerCase().includes(search.toLowerCase()) ||
        novel.userData?.user_name?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || novel.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const order = sortOrder === "asc" ? 1 : -1;
      
      switch (sortField) {
        case "title":
          return order * a.title.localeCompare(b.title);
        case "author":
          return order * ((a.userData?.user_name || "").localeCompare(b.userData?.user_name || ""));
        case "status":
          return order * a.status.localeCompare(b.status);
        case "chapters":
          return order * (a.publishedChapters - b.publishedChapters);
        case "views":
          return order * (a.viewCount - b.viewCount);
        case "comments":
          return order * (a.commentCount - b.commentCount);
        case "created":
          return order * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        default:
          return 0;
      }
    });
  
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };
  
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search novels..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("title")}
              >
                <div className="flex items-center">
                  Title
                  <SortIcon field="title" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("author")}
              >
                <div className="flex items-center">
                  Author
                  <SortIcon field="author" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("status")}
              >
                <div className="flex items-center">
                  Status
                  <SortIcon field="status" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("chapters")}
              >
                <div className="flex items-center">
                  Chapters
                  <SortIcon field="chapters" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("views")}
              >
                <div className="flex items-center">
                  Views
                  <SortIcon field="views" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("comments")}
              >
                <div className="flex items-center">
                  Comments
                  <SortIcon field="comments" />
                </div>
              </TableHead>
              <TableHead>Public</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredNovels.map((novel) => (
              <TableRow key={novel.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {novel.cover_image && (
                      <Image
                        src={novel.cover_image}
                        alt={novel.title}
                        width={40}
                        height={60}
                        className="rounded object-cover"
                      />
                    )}
                    <div>
                      <Link
                        href={`/admin/novels/${novel.id}`}
                        className="font-medium hover:underline"
                      >
                        {novel.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        Created {format(new Date(novel.created_at), 'PP')}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {novel.userData?.user_name || "Unknown Author"}
                </TableCell>
                <TableCell>
                  <NovelStatusManager
                    novelId={novel.id}
                    currentStatus={novel.status}
                    isPublic={novel.is_public}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <BookText className="h-4 w-4 text-muted-foreground" />
                    <span>{novel.publishedChapters}/{novel.totalChapters}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>{novel.viewCount}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span>{novel.commentCount}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={novel.is_public}
                    disabled={novel.status !== "approved"}
                  />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/novels/${novel.id}`}>
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/novels/${novel.id}/edit`}>
                          Edit Novel
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/novels/${novel.id}/chapters`}>
                          Manage Chapters
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/novels/${novel.id}/comments`}>
                          View Comments
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DeleteNovelDialog
                        novelId={novel.id}
                        novelTitle={novel.title}
                        trigger={
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="text-destructive"
                          >
                            Delete Novel
                          </DropdownMenuItem>
                        }
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 