import { ContentItem, AgentContext } from './types';
import axios from 'axios';
import { imageSearchTemplate, getImagePriorityForContentType } from './prompt-templates';

interface SerperImageResult {
  title: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  thumbnailUrl: string;
  thumbnailWidth: number;
  thumbnailHeight: number;
  source: string;
  domain: string;
  link: string;
  googleUrl: string;
  position: number;
}

interface SerperApiResponse {
  searchParameters: {
    q: string;
    gl: string;
    hl: string;
    num: number;
    type: string;
  };
  images: SerperImageResult[];
  error?: string;
}

export class ImageSearchAgent {
  private context: AgentContext;
  private serperApiKey: string;

  constructor(context: AgentContext) {
    this.context = context;
    this.serperApiKey = process.env.SERPER_API_KEY || '';
    
    if (!this.serperApiKey) {
      console.warn('SERPER_API_KEY environment variable is not set. Image search will be limited.');
    }
  }

  async findImageUrls(contentItems: ContentItem[]): Promise<ContentItem[]> {
    if (contentItems.length === 0) {
      return contentItems;
    }

    console.log(`Finding better image URLs for ${contentItems.length} content items...`);
    
    // Process items in batches to avoid rate limiting
    const batchSize = 3;
    const enhancedItems: ContentItem[] = [];
    
    for (let i = 0; i < contentItems.length; i += batchSize) {
      const batch = contentItems.slice(i, i + batchSize);
      const batchPromises = batch.map(item => this.findImageForContent(item));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        enhancedItems.push(...batchResults);
        console.log(`Processed batch ${i / batchSize + 1} of ${Math.ceil(contentItems.length / batchSize)}`);
        
        // Add a small delay between batches to avoid rate limiting
        if (i + batchSize < contentItems.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('Error processing image search batch:', error);
        // If batch fails, add original items
        enhancedItems.push(...batch);
      }
    }
    
    return enhancedItems;
  }

  private async findImageForContent(content: ContentItem): Promise<ContentItem> {
    try {
      // Skip if the content already has a valid image URL
      if (this.isValidImageUrl(content.image_url)) {
        return content;
      }

      // Try Serper API first if API key is available
      if (this.serperApiKey) {
        try {
          const imageUrl = await this.searchImageWithSerperApi(content);
          if (imageUrl && this.isValidImageUrl(imageUrl)) {
            console.log(`Found image for ${content.name} using Serper API: ${imageUrl}`);
            return {
              ...content,
              image_url: imageUrl
            };
          }
        } catch (serperError) {
          console.error(`Serper API error for ${content.name}:`, serperError);
          // Continue to fallback method if Serper API fails
        }
      }

      // Fallback to AI model if Serper API fails or is not available
      return this.findImageWithAI(content);
    } catch (error) {
      console.error(`Error finding image for ${content.name}:`, error);
      // Return the original content with a fallback image URL
      return {
        ...content,
        image_url: this.getFallbackImageUrl(content)
      };
    }
  }

  private async searchImageWithSerperApi(content: ContentItem): Promise<string | null> {
    // Create a search query based on content details
    let searchQuery = ""
    if(content.type === 'movies'){
      searchQuery = `${content.name} ${content.type} ${content.release_year} poster official search imdb and fandom`
    }
    else if(content.type === 'anime'){
      searchQuery = `${content.name} ${content.type} ${content.release_year} poster official search myanimelist and fandom`
    }
    else if(content.type === 'manga'){
      searchQuery = `${content.name} ${content.type} ${content.release_year} poster official search myanimelist and fandom`
    }
    else if(content.type === 'manhua'){
      searchQuery = `${content.name} ${content.type} ${content.release_year} poster official search myanimelist and fandom`
    }
    else if(content.type === 'manhwa'){
      searchQuery = `${content.name} ${content.type} ${content.release_year} poster official search myanimelist and fandom`
    }
    else if(content.type === 'webseries'){
      searchQuery = `${content.name} ${content.type} ${content.release_year} poster official search imdb and fandom`
    }
    else if(content.type === 'tv'){
      searchQuery = `${content.name} ${content.type} ${content.release_year} poster official search imdb and fandom`
    }
    else if(content.type === 'lightnovel'){
      searchQuery = `${content.name} ${content.type} ${content.release_year} poster official search lightnovelpub,webnovel,goodreads or novelupdates and fandom`
    }
    else if(content.type === 'webnovel'){
      searchQuery = `${content.name} ${content.type} ${content.release_year} poster official search lightnovelpub,webnovel,goodreads, novelupdates and fandom`
    }
    else if(content.type === 'book'){
      searchQuery = `${content.name} ${content.type} ${content.release_year} poster official search goodreads and fandom`
    }
    else{
      searchQuery = `${content.name} ${content.type} ${content.release_year} poster official search imdb and fandom`
    }

    
    try {
      console.log(`[Serper API] Searching for image: "${searchQuery}"`);
      
      const headers = {
        'X-API-KEY': this.serperApiKey,
        'Content-Type': 'application/json'
      };

      const requestBody = {
        q: searchQuery,
        gl: 'us',  // Google location parameter (country)
        hl: 'en',  // Language
        num: 10    // Number of results
      };

      console.log(`[Serper API] Making request to https://google.serper.dev/images`);
      const response = await axios.post(
        'https://google.serper.dev/images', 
        requestBody,
        { headers }
      );
      
      const data = response.data as SerperApiResponse;
      
      if (data.error) {
        console.error(`[Serper API] Error response: ${data.error}`);
        throw new Error(`Serper API error: ${data.error}`);
      }
      
      if (!data.images || data.images.length === 0) {
        console.log(`[Serper API] No images found for "${searchQuery}"`);
        return null;
      }
      
      console.log(`[Serper API] Found ${data.images.length} images for "${searchQuery}"`);
      
      // Find the best image from the results
      // Prefer images with "poster" or "cover" in the title or source
      const posterImages = data.images.filter(img => 
        (img.title && (img.title.toLowerCase().includes('poster') || img.title.toLowerCase().includes('cover'))) ||
        (img.source && (img.source.toLowerCase().includes('poster') || img.source.toLowerCase().includes('cover')))
      );
      
      // Use poster images if available, otherwise use the first result
      const bestImage = posterImages.length > 0 ? posterImages[0] : data.images[0];
      
      console.log(`[Serper API] Selected image: ${bestImage.imageUrl} (from ${bestImage.source || 'unknown source'})`);
      
      // Return the image URL
      return bestImage.imageUrl;
    } catch (error) {
      console.error('[Serper API] Search error:', error);
      return null;
    }
  }

  private async findImageWithAI(content: ContentItem): Promise<ContentItem> {
    try {
      // Get the appropriate image priority for this content type
      const imagePriority = getImagePriorityForContentType(content.type);
      
      // Replace placeholders in the template
      const prompt = imageSearchTemplate
        .replace('{{TITLE}}', content.name)
        .replace('{{TYPE}}', content.type)
        .replace('{{YEAR}}', content.release_year.toString())
        .replace('{{CREATOR}}', content.studio)
        .replace('{{GENRES}}', content.genres.join(', '))
        .replace('{{IMAGE_TYPE_PRIORITY}}', imagePriority);

      const result = await this.context.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }]}],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        }
      });
      
      const response = await result.response;
      const imageUrl = response.text().trim();
      
      // Validate the returned URL
      if (this.isValidImageUrl(imageUrl)) {
        console.log(`Found image for ${content.name} using AI: ${imageUrl}`);
        return {
          ...content,
          image_url: imageUrl
        };
      } else {
        // Fallback to a better default image if the returned URL is invalid
        const fallbackUrl = this.getFallbackImageUrl(content);
        console.log(`Using fallback image for ${content.name}: ${fallbackUrl}`);
        return {
          ...content,
          image_url: fallbackUrl
        };
      }
    } catch (error) {
      console.error(`AI image search error for ${content.name}:`, error);
      return content;
    }
  }

  private isValidImageUrl(url: string): boolean {
    if (!url) return false;
    
    try {
      const parsedUrl = new URL(url);
      const isHttps = parsedUrl.protocol === 'https:';
      const hasImageExtension = /\.(jpg|jpeg|png|gif|webp)($|\?)/.test(parsedUrl.pathname.toLowerCase());
      
      // Check for common image hosting domains
      const isReliableDomain = [
        'media-amazon.com',
        'images-na.ssl-images-amazon.com',
        'wikimedia.org',
        'myanimelist.net',
        'tmdb.org',
        'themoviedb.org',
        'imdb.com',
        'anilist.co',
        'crunchyroll.com',
        'netflix.com',
        'hulu.com',
        'amazon.com',
        'tvdb.com',
        'imgur.com',
        'staticflickr.com',
        'cloudfront.net',
        'akamaized.net',
        'ytimg.com',
        'googleusercontent.com',
        'pbs.twimg.com',
        'cdn.myanimelist.net',
        'cdn.animenewsnetwork.com',
        'cdn.anilist.co',
        'gstatic.com',
        'ggpht.com',
        'bp.blogspot.com',
        'ssl-images-amazon.com',
        'static.wikia.nocookie.net',
        'i.pinimg.com',
        'upload.wikimedia.org'
      ].some(domain => parsedUrl.hostname.includes(domain));
      
      return isHttps && (hasImageExtension || isReliableDomain);
    } catch (e) {
      return false;
    }
  }

  private getFallbackImageUrl(content: ContentItem): string {
    const encodedTitle = encodeURIComponent(content.name);
    const type = content.type.toLowerCase();
    
    // Better fallback images based on content type
    switch(type) {
      case 'movie':
        return `/images/placeholder.jpg`;
      case 'anime':
        return `/images/placeholder.jpg`;
      case 'manga':
        return `/images/placeholder.jpg`;
      case 'manhua':
        return `/images/placeholder.jpg`;
      case 'manhwa':
        return `/images/placeholder.jpg`;
      case 'webseries':
      case 'tv':
        return `/images/placeholder.jpg`;
      case 'lightnovel':
        return `/images/placeholder.jpg`;
      case 'webnovel':  
        return `/images/placeholder.jpg`;
      case 'book':
        return `/images/placeholder.jpg`;
      default:
        return `/images/placeholder.jpg`;
    }
  }
} 