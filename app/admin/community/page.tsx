import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAllPosts, getCommunitySettings, type PostRow } from "@/lib/affiliate/data";
import { deletePostAction, moderatePostAction } from "./actions";
import { requirePermission } from "../guard";
import CommunitySettings from "./CommunitySettings";
import AddToCommunityForm from "./AddToCommunityForm";
import EditPostForm from "./EditPostForm";
import SeedPostsButton from "./SeedPostsButton";

export const dynamic = "force-dynamic";

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

const STATUS_STYLES: Record<string, string> = {
  pending:  "bg-amber-50 text-amber-800 border-amber-200",
  approved: "bg-emerald-50 text-emerald-800 border-emerald-200",
  rejected: "bg-stone-100 text-stone-600 border-stone-200",
  hidden:   "bg-stone-100 text-stone-600 border-stone-200",
};

function imageUrlFor(post: PostRow): string | null {
  if (!post.image_path) return null;
  const admin = createAdminClient();
  const { data } = admin.storage.from("community-images").getPublicUrl(post.image_path);
  return data?.publicUrl ?? null;
}

function PostCard({ post }: { post: PostRow }) {
  const imageUrl = imageUrlFor(post);
  return (
    <li className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
        <div>
          <div className="text-sm font-semibold text-stone-800">
            {post.author_name || post.author_email}
          </div>
          {post.author_name && (
            <div className="text-[11px] text-stone-500">{post.author_email}</div>
          )}
          <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 mt-0.5">
            posted {fmt(post.created_at)}
          </div>
        </div>
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-[10px] tracking-wider uppercase font-semibold border ${
            STATUS_STYLES[post.status] ?? STATUS_STYLES.rejected
          }`}
        >
          {post.status}
        </span>
      </div>
      <p className="text-sm text-stone-700 whitespace-pre-wrap break-words mb-3">{post.body}</p>
      {imageUrl && (
        <div className="mb-3 relative w-full max-w-md aspect-video">
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 28rem"
            unoptimized
            className="rounded-lg border border-stone-200 object-cover"
          />
        </div>
      )}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        {post.status !== "approved" && (
          <form action={moderatePostAction}>
            <input type="hidden" name="id" value={post.id} />
            <input type="hidden" name="decision" value="approved" />
            <button
              type="submit"
              className="px-3 py-1.5 font-semibold rounded-lg text-white"
              style={{ backgroundColor: "#5b7351" }}
            >
              Approve
            </button>
          </form>
        )}
        {post.status === "approved" && (
          <form action={moderatePostAction}>
            <input type="hidden" name="id" value={post.id} />
            <input type="hidden" name="decision" value="hidden" />
            <button
              type="submit"
              className="px-3 py-1.5 font-semibold rounded-lg"
              style={{ backgroundColor: "#fafaf9", color: "#57534e", border: "1px solid #e7e5e4" }}
            >
              Hide
            </button>
          </form>
        )}
        {post.status !== "rejected" && (
          <form action={moderatePostAction}>
            <input type="hidden" name="id" value={post.id} />
            <input type="hidden" name="decision" value="rejected" />
            <button
              type="submit"
              className="px-3 py-1.5 font-semibold rounded-lg"
              style={{ backgroundColor: "#fafaf9", color: "#7c2d2d", border: "1px solid #fecaca" }}
            >
              Reject
            </button>
          </form>
        )}
        <form action={deletePostAction}>
          <input type="hidden" name="id" value={post.id} />
          <button
            type="submit"
            className="px-3 py-1.5 font-semibold rounded-lg"
            style={{ backgroundColor: "#dc2626", color: "#fff" }}
          >
            Delete
          </button>
        </form>
        <EditPostForm post={post} />
        <div className="ml-auto text-[10px] tracking-[0.18em] uppercase text-stone-500">
          {post.reaction_count.toLocaleString()} reactions
        </div>
      </div>
    </li>
  );
}

export default async function AdminCommunityPage() {
  await requirePermission("community");
  const [posts, settings] = await Promise.all([getAllPosts(), getCommunitySettings()]);
  const pending = posts.filter((p) => p.status === "pending");
  const others = posts.filter((p) => p.status !== "pending");

  return (
    <div className="space-y-8">
      <AddToCommunityForm />
      <CommunitySettings quote={settings.quote} theme={settings.theme} />

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-xl text-forest-deep">Pending wins</h2>
          <div className="text-xs italic text-stone">{pending.length} waiting on review</div>
        </div>
        {pending.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white p-6 text-sm italic text-stone-500">
            Nothing waiting for your approval.
          </div>
        ) : (
          <ul className="space-y-3">
            {pending.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-xl text-forest-deep">Approved + archived</h2>
          <div className="text-xs italic text-stone">{others.length} total</div>
        </div>
        {others.length === 0 && <div className="mb-4"><SeedPostsButton /></div>}
        {others.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white p-6 text-sm italic text-stone-500">
            Nothing decided yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {others.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
