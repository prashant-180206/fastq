import { mutation } from "../_generated/server";

// One-off utility to backfill the denormalized `searchText` field used by the
// full-text search index. Run after deploying the schema change:
//
//   pnpm convex run business/migrations:backfillSearchText
//
// Intentionally unauthenticated so the CLI can run it standalone; it only
// normalizes a derived display field and never touches other data.
export const backfillSearchText = mutation({
  args: {},

  handler: async (ctx) => {
    const businesses = await ctx.db.query("businesses").collect();

    let updated = 0;

    for (const business of businesses) {
      const searchText = [business.name, business.description, business.contactEmail]
        .filter(Boolean)
        .join(" ");

      const patch: {
        searchText?: string;
        type?: "business";
        updatedAt?: number;
      } = {};

      if (business.searchText !== searchText) {
        patch.searchText = searchText;
      }

      if (business.type === undefined) {
        patch.type = "business";
      }

      if (Object.keys(patch).length === 0) {
        continue;
      }

      patch.updatedAt = Date.now();
      await ctx.db.patch(business._id, patch);
      updated += 1;
    }

    return { scanned: businesses.length, updated };
  },
});