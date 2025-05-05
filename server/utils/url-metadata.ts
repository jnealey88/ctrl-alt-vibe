import puppeteer from 'puppeteer';
import ogs from 'open-graph-scraper';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import crypto from 'crypto';

const writeFileAsync = promisify(fs.writeFile);

// Ensure the uploads directory exists
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Generate a random filename with a specific extension
 */
const generateFilename = (extension: string) => {
  const randomStr = crypto.randomBytes(16).toString('hex');
  return `${randomStr}${extension}`;
};

/**
 * Extract metadata from a URL
 */
export async function extractUrlMetadata(url: string) {
  try {
    // Use open-graph-scraper to extract metadata
    const { result } = await ogs({ url });
    
    // Handle image extraction without TypeScript errors
    let imageUrl = '';
    try {
      // Try to get image URL from various possible formats
      if (result.ogImage) {
        if (Array.isArray(result.ogImage) && result.ogImage.length > 0) {
          const firstImage = result.ogImage[0];
          imageUrl = typeof firstImage === 'object' && firstImage && 'url' in firstImage ? String(firstImage.url) : '';
        } else if (typeof result.ogImage === 'object' && result.ogImage && 'url' in result.ogImage) {
          imageUrl = String(result.ogImage.url);
        }
      } else if (result.twitterImage) {
        if (Array.isArray(result.twitterImage) && result.twitterImage.length > 0) {
          const firstImage = result.twitterImage[0];
          imageUrl = typeof firstImage === 'object' && firstImage && 'url' in firstImage ? String(firstImage.url) : '';
        } else if (typeof result.twitterImage === 'object' && result.twitterImage && 'url' in result.twitterImage) {
          imageUrl = String(result.twitterImage.url);
        }
      }
    } catch (e) {
      console.error('Error extracting image URL:', e);
    }
    
    return {
      title: result.ogTitle || result.twitterTitle || '',
      description: result.ogDescription || result.twitterDescription || '',
      imageUrl,
      success: true
    };
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return {
      title: '',
      description: '',
      imageUrl: '',
      success: false
    };
  }
}

/**
 * Take a screenshot of a website URL
 */
export async function takeWebsiteScreenshot(url: string): Promise<{ success: boolean; fileUrl: string }> {
  let browser;
  try {
    // Make sure uploads directory exists
    try {
      if (!fs.existsSync(uploadsDir)) {
        console.log(`Creating uploads directory at ${uploadsDir}`);
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
    } catch (fsError) {
      console.error('Error checking/creating uploads directory:', fsError);
    }
    
    // Create screenshot filename
    const filename = generateFilename('.png');
    const screenshotPath = path.join(uploadsDir, filename);
    
    console.log('Attempting to take screenshot of:', url);
    console.log('Screenshot will be saved to:', screenshotPath);
    
    // Find Chromium executable
    const chromiumPaths = [
      // Check environment variable first
      process.env.PUPPETEER_EXECUTABLE_PATH,
      // Check common Nix store paths
      '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
      // Check standard path from system install
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      // Add chromium from the system dependency installation
      'chromium'
    ].filter(Boolean); // Remove undefined/null entries
    
    let chromiumPath = null;
    for (const path of chromiumPaths) {
      try {
        if (path && fs.existsSync(path)) {
          chromiumPath = path;
          console.log(`Found Chromium at: ${path}`);
          break;
        }
      } catch (e) {
        // Continue checking other paths
      }
    }
    
    console.log('Using Chromium path:', chromiumPath || 'Default bundled with Puppeteer');
    
    // Launch puppeteer browser with minimal options (no sandbox for cloud environments)
    let launchOptions: any = {
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: true // Use headless mode
    };
    
    if (chromiumPath) {
      launchOptions.executablePath = chromiumPath;
    }
    
    browser = await puppeteer.launch(launchOptions);
    
    const page = await browser.newPage();
    
    // Set a reasonable viewport size
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to the page with a timeout
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait a bit for any lazy-loaded content
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take a screenshot
    await page.screenshot({ path: screenshotPath, fullPage: false });
    
    // Verify the file was created
    if (fs.existsSync(screenshotPath)) {
      console.log('Screenshot saved successfully to:', screenshotPath);
      return {
        success: true,
        fileUrl: `/uploads/${filename}`
      };
    } else {
      console.error('Screenshot file not found after saving');
      return {
        success: false,
        fileUrl: ''
      };
    }
  } catch (error) {
    console.error('Error taking screenshot:', error);
    return {
      success: false,
      fileUrl: ''
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Fetch all metadata and screenshot for a URL
 */
export async function processUrlForProject(url: string) {
  try {
    // First get the metadata
    const metadata = await extractUrlMetadata(url);
    
    // Then try to take a screenshot
    let screenshotResult = { success: false, fileUrl: '' };
    try {
      screenshotResult = await takeWebsiteScreenshot(url);
    } catch (error) {
      console.error('Screenshot failed, falling back to OG image:', error);
    }
    
    // Prepare the image URL
    let imageUrl = '';
    if (screenshotResult.success) {
      // We have a screenshot from our server
      imageUrl = screenshotResult.fileUrl;
    } else if (metadata.imageUrl && (metadata.imageUrl.startsWith('http://') || metadata.imageUrl.startsWith('https://'))) {
      // We have an OG image with a valid URL
      imageUrl = metadata.imageUrl;
    }

    return {
      title: metadata.title,
      description: metadata.description,
      imageUrl: imageUrl,
      success: metadata.success || screenshotResult.success
    };
  } catch (error) {
    console.error('Failed to process URL for project:', error);
    return {
      title: '',
      description: '',
      imageUrl: '',
      success: false
    };
  }
}
