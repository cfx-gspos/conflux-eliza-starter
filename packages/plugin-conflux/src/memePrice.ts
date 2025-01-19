import { readFile,writeFile } from 'fs/promises';


export async function getMemePrice(): Promise<number> {
  const priceFilePath =  'price.txt';

  try {
    const settings = Object.fromEntries(
      Object.entries(process.env).filter(([key]) => key.startsWith("CONFLUX_"))
    );
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${settings.CONFLUX_MEME_COIN}`
    );
    const data = await response.json();
    if (data.pairs && data.pairs[0] && data.pairs[0].priceNative) {
      const price = parseFloat(data.pairs[0].priceNative);
      // Store the latest price to file
      await writeFile(priceFilePath, price.toString());
      return price;
    }
    throw new Error("Unable to fetch MEME price");
  } catch (error) {
    console.error("Error fetching MEME price:", error);
    try {
      // Try to read the last saved price from file
      const savedPrice = await  readFile(priceFilePath, 'utf-8');
      return parseFloat(savedPrice);
    } catch (readError) {
      console.error("Error reading saved price:", readError);
      return 0.0007; // Ultimate fallback price if both API and file read fail
    }
  }
}
