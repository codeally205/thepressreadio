-- Create media table for file uploads
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    url TEXT NOT NULL,
    alt TEXT,
    caption TEXT,
    uploaded_by UUID REFERENCES "user"(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX idx_media_mime_type ON media(mime_type);
CREATE INDEX idx_media_created_at ON media(created_at DESC);

-- Add comments for clarity
COMMENT ON TABLE media IS 'Stores information about uploaded media files';
COMMENT ON COLUMN media.filename IS 'Generated filename on disk';
COMMENT ON COLUMN media.original_name IS 'Original filename from user';
COMMENT ON COLUMN media.size IS 'File size in bytes';
COMMENT ON COLUMN media.url IS 'Public URL to access the file';