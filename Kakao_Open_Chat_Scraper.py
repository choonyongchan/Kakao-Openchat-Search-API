import aiohttp
import asyncio
from datetime import datetime
import numpy as np
import os
import pandas as pd
from tqdm.asyncio import tqdm_asyncio
import validators


class Kakao:

    API: str = 'https://open.kakao.com/c/search/unified?q=kakao'

    def __init__(self, search_term: str):
        self.search_term: str = search_term

    def check_resource_available(self, search_term: str) -> None:

        def get_path(filename: str) -> str:
            curr_dir = os.path.dirname(__name__)
            abs_path = os.path.join(curr_dir, filename)
            return abs_path

        def check(filename: str) -> False:
            # Check if file exists.
            is_exist: bool = os.path.exists(get_path(filename))
            if not is_exist:
                return True
            # If exists, check if file closed.
            try:
                open(filename, 'r')
                return True
            except IOError:
                return False

        html_filename: str = search_term + '.html'
        csv_filename: str = search_term + '.csv'
        return check(html_filename) and check(csv_filename)

    async def get(self) -> pd.DataFrame:

        async def get_per_page(page: int, session: aiohttp.ClientSession) -> dict:
            params: dict = {
                'q': self.search_term,
                'p': page}
            async with session.get(self.API, params=params) as response:
                return await response.json()

        async with aiohttp.ClientSession() as session:
            responses: list[dict] = await tqdm_asyncio.gather(
                *(get_per_page(page, session) for page in range(1, 101)),
                desc='Getting Open Chat Details',
                unit='page')
            return self.parse(responses)

    def parse(self, responses: list[dict]) -> pd.DataFrame:

        def drop_irr_cols(df: pd.DataFrame) -> pd.DataFrame:
            irr_colnames: list[str] = ['lt', 'vrLiveon', 'jrds', 'profilePostCount', 'oc', 'op']
            return df.drop(irr_colnames, axis=1)

        def parse_datetime(df: pd.DataFrame) -> pd.DataFrame:
            df['writtenAt'] = [
                datetime.fromtimestamp(e) if not np.isnan(e) else e
                for e in df['writtenAt']]
            return df

        def process_links(df: pd.DataFrame) -> pd.DataFrame:
            def get_per_link(url: str) -> str:
                if not validators.url(url):
                    return np.nan
                return '<a href="' + url + '" target="_blank">' + url + '</a>'
            df['lu'] = [get_per_link(url) for url in df['lu']]
            return df

        def process_images(df: pd.DataFrame) -> pd.DataFrame:
            def get_per_image(url: str) -> bytes:
                if not validators.url(url):
                    return np.nan
                return '<img src="' + url + '" width="60" >'
            df['liu'] = [get_per_image(url) for url in df['liu']]
            df['pi'] = [get_per_image(url) for url in df['pi']]
            return df

        dfs: list[pd.DataFrame] = (pd.DataFrame(resp['items']) for resp in responses)
        df: pd.DataFrame = pd.concat(dfs, ignore_index=True)

        if df.empty:
            print(f'No results found for search term: {self.search_term}')
            print("Completed")
            exit()

        df: pd.DataFrame = drop_irr_cols(df)
        df: pd.DataFrame = parse_datetime(df)
        df: pd.DataFrame = process_links(df)
        df: pd.DataFrame = process_images(df)

        return df

    def save(self, df: pd.DataFrame, filename: str) -> None:
        html_filename: str = filename + '.html'
        csv_filename: str = filename + '.csv'

        df.columns = ['Similarity Score', 'Open Chat Name', 'Open Chat Share Link', 'Password Locked?', 'Description', 'Open Chat Profile Picture', 'Member Count', 'Open Chat Admin', 'Admin Profile Picture', 'Search Hashtags', 'Last Message Sent At', 'Likes Count']
        df.to_csv(csv_filename, index=False)
        df.to_html(html_filename, index=False, escape=False)


async def main() -> None:

    search_term: str = 'kakao'
    kakao: Kakao = Kakao(search_term)

    kakao.check_resource_available(search_term)
    results: pd.DataFrame = await kakao.get()
    kakao.save(results, search_term)


if __name__ == '__main__':
    print("Kakao Open Chat Scraper by @choonyy")
    asyncio.run(main())
    print("Completed")
