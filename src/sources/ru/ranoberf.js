import * as cheerio from 'cheerio';
import { htmlToText } from '../helpers/htmlToText';

const sourceId = 119;
const sourceName = 'РанобэРФ';

const baseUrl = 'https://ранобэ.рф';

const popularNovels = async page => {
  const totalPages = 9;
  const result = await fetch(baseUrl + '/?page=' + page);
  const body = await result.text();

  const loadedCheerio = cheerio.load(body);
  let json = loadedCheerio('#__NEXT_DATA__').html();
  json = JSON.parse(json);
  let novels = [];

  json.props.pageProps.totalData.items.map(item => {
    const novelName = item.title;
    const novelCover = baseUrl + item.verticalImage.url;
    const novelUrl = baseUrl + item.url;
    novels.push({ sourceId, novelName, novelCover, novelUrl });
  });

  return { totalPages, novels };
};

const parseNovelAndChapters = async novelUrl => {
  const result = await fetch(novelUrl);
  const body = await result.text();

  const loadedCheerio = cheerio.load(body);
  let json = loadedCheerio('#__NEXT_DATA__').html();
  json = JSON.parse(json);

  let novel = {
    sourceId,
    sourceName,
    url: novelUrl,
    novelUrl,
    novelName: json.props.pageProps.book.title,
    novelCover: baseUrl + json.props.pageProps.book.verticalImage.url,
    summary: htmlToText(json.props.pageProps.book.description),
    author: json.props.pageProps.book?.author || null,
  };
  let chapters = [];

  json.props.pageProps.book.chapters.map(item => {
    const chapterName = item.title
    const releaseDate = item.publishedAt;
    const chapterUrl = baseUrl + item.url;

    if (!item.isDonate) chapters.push({ chapterName, releaseDate, chapterUrl });
  });

  novel.chapters = chapters.reverse();
  return novel;
};

const parseChapter = async (novelUrl, chapterUrl) => {
  const result = await fetch(chapterUrl);
  const body = await result.text();

  const loadedCheerio = cheerio.load(body);
  let json = loadedCheerio('#__NEXT_DATA__').html();
  json = JSON.parse(json);

  const chapterName = json.props.pageProps.chapter.title
  let temp = cheerio.load(json.props.pageProps.chapter.content.text);

  temp('img').each(function() {
    if (!loadedCheerio(this).attr('src')?.startsWith('http')) {
      let src = loadedCheerio(this).attr('src');
      loadedCheerio(this).attr('src', baseUrl + src);
    }
  });

  const chapterText = temp.html();
  const chapter = {
    sourceId,
    novelUrl,
    chapterUrl,
    chapterName,
    chapterText,
  };

  return chapter;
};

const searchNovels = async searchTerm => {
  const url = `${baseUrl}/v3/books?filter[or][0][title][like]=${searchTerm}&filter[or][1][titleEn][like]=${searchTerm}&filter[or][2][fullTitle][like]=${searchTerm}&filter[status][]=active&filter[status][]=abandoned&filter[status][]=completed&expand=verticalImage`;
  const result = await fetch(url);
  const body = await result.json();
  let novels = [];

  body.items.map(item => {
    const novelName = item.title;
    const novelCover = baseUrl + item.verticalImage.url;
    const novelUrl = baseUrl + item.url;
    novels.push({ sourceId, novelName, novelCover, novelUrl });
  });

  return novels;
};

const RanobeRFScraper = {
  popularNovels,
  parseNovelAndChapters,
  parseChapter,
  searchNovels,
};

export default RanobeRFScraper;