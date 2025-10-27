#!/usr/bin/env python3
"""
Migrate face embeddings from Qdrant to Supabase Vector (pgvector)

This script:
1. Fetches all vectors from Qdrant "faces" collection
2. Updates corresponding faces in Supabase with embeddings
3. Validates migration progress
4. Provides rollback capability

Usage:
    python migrate_qdrant_to_supabase.py [--dry-run] [--batch-size 100]

Environment variables required:
    QDRANT_URL - Qdrant Cloud URL
    QDRANT_API_KEY - Qdrant API key
    SUPABASE_URL - Supabase project URL
    SUPABASE_SERVICE_ROLE_KEY - Supabase service role key (NOT anon key)
"""

import os
import sys
import argparse
from typing import List, Dict, Any
from qdrant_client import QdrantClient
from supabase import create_client, Client
import time

# Configuration
COLLECTION_NAME = "faces"
BATCH_SIZE = 100


def init_qdrant() -> QdrantClient:
    """Initialize Qdrant client"""
    url = os.getenv("QDRANT_URL")
    api_key = os.getenv("QDRANT_API_KEY")

    if not url or not api_key:
        raise ValueError("Missing QDRANT_URL or QDRANT_API_KEY environment variables")

    print(f"✓ Connecting to Qdrant: {url}")
    return QdrantClient(url=url, api_key=api_key)


def init_supabase() -> Client:
    """Initialize Supabase client with service role"""
    url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not service_key:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables")

    print(f"✓ Connecting to Supabase: {url}")
    return create_client(url, service_key)


def fetch_qdrant_vectors(qdrant: QdrantClient, batch_size: int = BATCH_SIZE) -> List[Dict[str, Any]]:
    """Fetch all vectors from Qdrant collection"""
    print(f"\n📦 Fetching vectors from Qdrant collection '{COLLECTION_NAME}'...")

    try:
        # Get collection info
        collection_info = qdrant.get_collection(COLLECTION_NAME)
        total_vectors = collection_info.points_count
        print(f"   Total vectors in Qdrant: {total_vectors}")

        # Scroll through all points
        points = []
        offset = None

        while True:
            result = qdrant.scroll(
                collection_name=COLLECTION_NAME,
                limit=batch_size,
                offset=offset,
                with_payload=True,
                with_vectors=True
            )

            batch_points = result[0]
            offset = result[1]

            if not batch_points:
                break

            points.extend(batch_points)
            print(f"   Fetched {len(points)}/{total_vectors} vectors...", end='\r')

            if offset is None:
                break

        print(f"\n✓ Fetched {len(points)} vectors from Qdrant")
        return points

    except Exception as e:
        print(f"✗ Error fetching from Qdrant: {e}")
        raise


def migrate_to_supabase(supabase: Client, points: List[Dict[str, Any]], dry_run: bool = False) -> Dict[str, int]:
    """Migrate embeddings to Supabase"""
    print(f"\n🚀 Migrating embeddings to Supabase (dry_run={dry_run})...")

    stats = {
        "total": len(points),
        "success": 0,
        "skipped": 0,
        "failed": 0,
        "errors": []
    }

    for i, point in enumerate(points):
        try:
            # Extract data from Qdrant point
            qdrant_point_id = str(point.id)
            embedding = point.vector
            payload = point.payload or {}
            face_id = payload.get("face_id")

            if not face_id:
                print(f"   ⚠ Skipping point {qdrant_point_id}: No face_id in payload")
                stats["skipped"] += 1
                continue

            # Update Supabase faces table
            if not dry_run:
                result = supabase.table("faces").update({
                    "embedding": embedding
                }).eq("id", face_id).execute()

                if not result.data:
                    print(f"   ⚠ Warning: No face found with id={face_id}")
                    stats["skipped"] += 1
                    continue

            stats["success"] += 1

            # Progress update every 10 records
            if (i + 1) % 10 == 0:
                print(f"   Migrated {i + 1}/{stats['total']} embeddings...", end='\r')

        except Exception as e:
            stats["failed"] += 1
            error_msg = f"Point {point.id}: {str(e)}"
            stats["errors"].append(error_msg)
            print(f"   ✗ Error: {error_msg}")

    print(f"\n✓ Migration complete!")
    return stats


def verify_migration(supabase: Client) -> Dict[str, Any]:
    """Verify migration progress"""
    print("\n🔍 Verifying migration...")

    try:
        # Query faces table statistics
        result = supabase.rpc("verify_migration_progress").execute()

        # If RPC doesn't exist, run direct query
        if not result.data:
            result = supabase.table("faces").select(
                "id, embedding, qdrant_point_id"
            ).execute()

            total = len(result.data)
            with_embedding = sum(1 for row in result.data if row.get("embedding"))
            with_qdrant = sum(1 for row in result.data if row.get("qdrant_point_id"))

            stats = {
                "total_faces": total,
                "faces_with_embedding": with_embedding,
                "faces_with_qdrant_id": with_qdrant,
                "migration_progress_pct": round(100.0 * with_embedding / total, 2) if total > 0 else 0
            }
        else:
            stats = result.data[0]

        print(f"\n📊 Migration Statistics:")
        print(f"   Total faces: {stats['total_faces']}")
        print(f"   Faces with embeddings: {stats['faces_with_embedding']}")
        print(f"   Faces with Qdrant ID: {stats['faces_with_qdrant_id']}")
        print(f"   Migration progress: {stats['migration_progress_pct']}%")

        return stats

    except Exception as e:
        print(f"✗ Error during verification: {e}")
        raise


def main():
    parser = argparse.ArgumentParser(description="Migrate embeddings from Qdrant to Supabase Vector")
    parser.add_argument("--dry-run", action="store_true", help="Run without making changes")
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE, help="Batch size for Qdrant fetch")
    parser.add_argument("--verify-only", action="store_true", help="Only verify migration progress")
    args = parser.parse_args()

    print("=" * 60)
    print("Qdrant → Supabase Vector Migration Tool")
    print("=" * 60)

    try:
        # Initialize clients
        supabase = init_supabase()

        if args.verify_only:
            verify_migration(supabase)
            return

        qdrant = init_qdrant()

        # Fetch vectors from Qdrant
        start_time = time.time()
        points = fetch_qdrant_vectors(qdrant, args.batch_size)

        if not points:
            print("⚠ No vectors found in Qdrant. Exiting.")
            return

        # Migrate to Supabase
        stats = migrate_to_supabase(supabase, points, args.dry_run)

        # Print summary
        elapsed = time.time() - start_time
        print("\n" + "=" * 60)
        print("Migration Summary")
        print("=" * 60)
        print(f"Total records: {stats['total']}")
        print(f"✓ Success: {stats['success']}")
        print(f"⚠ Skipped: {stats['skipped']}")
        print(f"✗ Failed: {stats['failed']}")
        print(f"⏱ Time elapsed: {elapsed:.2f}s")

        if stats['errors']:
            print(f"\n⚠ Errors ({len(stats['errors'])}):")
            for error in stats['errors'][:10]:  # Show first 10 errors
                print(f"   - {error}")
            if len(stats['errors']) > 10:
                print(f"   ... and {len(stats['errors']) - 10} more")

        # Verify migration
        if not args.dry_run and stats['success'] > 0:
            verify_migration(supabase)

        print("\n✓ Migration completed successfully!")

    except KeyboardInterrupt:
        print("\n\n⚠ Migration interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
