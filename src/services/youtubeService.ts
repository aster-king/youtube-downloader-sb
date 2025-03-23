
import { formatFileSize } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface DownloadOptions {
  videoId: string;
  quality: string;
  includeSubtitles: boolean;
  includeThumbnail: boolean;
}

interface DownloadResponse {
  success: boolean;
  url?: string;
  error?: string;
  message?: string;
  filename?: string;
  fileSize?: number;
  fileType?: string;
}

export const downloadYouTubeVideo = async (options: DownloadOptions): Promise<DownloadResponse> => {
  try {
    console.log("Preparing download with options:", options);
    
    // We'll use our Supabase Edge Function to handle the download
    const { data, error } = await supabase.functions.invoke('download-youtube', {
      body: {
        videoId: options.videoId,
        quality: options.quality,
        includeSubtitles: options.includeSubtitles,
        includeThumbnail: options.includeThumbnail,
      },
    });
    
    if (error) {
      throw new Error(error.message || "Failed to download video");
    }
    
    if (!data || !data.downloadUrl) {
      throw new Error("No download URL provided by the server");
    }
    
    console.log("Download response:", data);
    
    return {
      success: true,
      url: data.downloadUrl,
      message: "Video fetched successfully",
      filename: data.filename,
      fileSize: data.fileSize,
      fileType: data.fileType
    };
  } catch (error) {
    console.error("Error downloading video:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to download video"
    };
  }
};

// Helper function to map our quality options to the format codes
export const getFormatFromQuality = (quality: string): string => {
  switch (quality) {
    case "360p":
      return "360";
    case "720p":
      return "720";
    case "1080p":
      return "1080";
    case "4K":
      return "4k";
    default:
      return "720";
  }
};

// Function to get estimated file size based on quality and duration
export const getEstimatedFileSize = (quality: string, durationSeconds: number): string => {
  // Rough estimate of bitrates in bits per second
  const bitrates: Record<string, number> = {
    "360p": 1000000,  // ~1 Mbps
    "720p": 2500000,  // ~2.5 Mbps
    "1080p": 5000000, // ~5 Mbps
    "4K": 15000000,   // ~15 Mbps
  };
  
  const bitrate = bitrates[quality] || bitrates["720p"];
  const sizeInBytes = (bitrate / 8) * durationSeconds;
  
  return formatFileSize(sizeInBytes);
};
