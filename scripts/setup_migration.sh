#!/bin/bash
# Setup script for Phase 2: Supabase Vector Migration

set -e  # Exit on error

echo "=================================================="
echo "Phase 2: Supabase Vector Migration Setup"
echo "=================================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+"
    exit 1
fi

echo "✓ Python 3 found: $(python3 --version)"
echo ""

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt
echo "✓ Dependencies installed"
echo ""

# Check environment variables
echo "🔍 Checking environment variables..."

missing_vars=0

if [ -z "$QDRANT_URL" ]; then
    echo "⚠  QDRANT_URL is not set"
    missing_vars=1
fi

if [ -z "$QDRANT_API_KEY" ]; then
    echo "⚠  QDRANT_API_KEY is not set"
    missing_vars=1
fi

if [ -z "$SUPABASE_URL" ]; then
    echo "⚠  SUPABASE_URL is not set"
    missing_vars=1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "⚠  SUPABASE_SERVICE_ROLE_KEY is not set"
    missing_vars=1
fi

if [ $missing_vars -eq 1 ]; then
    echo ""
    echo "❌ Missing environment variables. Please set:"
    echo ""
    echo "export QDRANT_URL=\"https://xxx.qdrant.tech\""
    echo "export QDRANT_API_KEY=\"your-qdrant-key\""
    echo "export SUPABASE_URL=\"https://xxx.supabase.co\""
    echo "export SUPABASE_SERVICE_ROLE_KEY=\"your-service-role-key\""
    echo ""
    exit 1
fi

echo "✓ All environment variables set"
echo ""

# Test Qdrant connection
echo "🔌 Testing Qdrant connection..."
python3 -c "
from qdrant_client import QdrantClient
import os
import sys
try:
    client = QdrantClient(url=os.getenv('QDRANT_URL'), api_key=os.getenv('QDRANT_API_KEY'))
    collections = client.get_collections()
    print('✓ Connected to Qdrant successfully')
except Exception as e:
    print(f'❌ Qdrant connection failed: {e}')
    sys.exit(1)
"

# Test Supabase connection
echo "🔌 Testing Supabase connection..."
python3 -c "
from supabase import create_client
import os
import sys
try:
    client = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
    # Test query
    result = client.table('faces').select('id').limit(1).execute()
    print('✓ Connected to Supabase successfully')
except Exception as e:
    print(f'❌ Supabase connection failed: {e}')
    sys.exit(1)
"

echo ""
echo "=================================================="
echo "✓ Setup complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Apply SQL migrations to Supabase (via Dashboard or CLI)"
echo "2. Run dry-run migration:"
echo "   python migrate_qdrant_to_supabase.py --dry-run"
echo ""
echo "3. Run actual migration:"
echo "   python migrate_qdrant_to_supabase.py"
echo ""
echo "4. Verify migration:"
echo "   python migrate_qdrant_to_supabase.py --verify-only"
echo ""
