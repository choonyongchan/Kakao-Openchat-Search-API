import aiohttp
import argparse
import asyncio
from datetime import datetime
import logging
import math
import os
import pandas as pd
from tqdm.asyncio import tqdm_asyncio
import validators


class Kakao:

    logging.basicConfig(
        filename='kakao.log',
        format='%(asctime)s %(levelname)-8s %(message)s',
        level=logging.INFO,
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    API: str = 'https://open.kakao.com/c/search/unified'

    def __init__(self, search_term: str):
        self.search_term: str = search_term
        self.html_out: str = f"{search_term}.html"
        self.csv_out: str = f"{search_term}.csv"

    def check_resource_available(self) -> bool:

        def get_path(filename: str) -> str:
            curr_dir = os.path.dirname(__name__)
            return os.path.join(curr_dir, filename)

        def check(filename: str) -> False:
            try:
                filepath = get_path(filename)
                open(filepath, 'r')  # Try open file.
                return True
            except FileNotFoundError:
                return True  # Confirm closed.
            except IOError:
                return False  # File is opened.

        return check(self.html_out) and check(self.csv_out)

    async def get(self) -> pd.DataFrame:

        async def get_per_page(page: int) -> dict:
            params['p'] = page
            async with session.get(self.API, params=params) as response:
                return await response.json()

        params: dict = {
            'q': self.search_term,
            'c': 100,
            'p': 1}  # Default val
        async with aiohttp.ClientSession() as session:
            responses: list[dict] = await tqdm_asyncio.gather(
                *(get_per_page(page) for page in range(1, 101)),
                desc='Finding Open Chats',
                unit='page')
            return self.parse(responses)

    def parse(self, responses: list[dict]) -> pd.DataFrame:

        def drop_irr_cols(df: pd.DataFrame) -> pd.DataFrame:
            irr_colnames: list[str] = ['lt', 'vrLiveon', 'jrds',
                                       'profilePostCount', 'oc', 'op']
            return df.drop(df.columns.intersection(irr_colnames), axis=1)

        def parse_datetime(df: pd.DataFrame) -> pd.DataFrame:
            df['writtenAt'] = [
                datetime.fromtimestamp(ep) if not math.isnan(ep) else ep
                for ep in df['writtenAt']]
            return df

        def process_links(df: pd.DataFrame) -> pd.DataFrame:
            def get_per_link(url: str) -> str:
                if not validators.url(url):
                    return math.nan
                return '<a href="' + url + '" target="_blank">' + url + '</a>'
            df['lu'] = [get_per_link(url) for url in df['lu']]
            return df

        def process_images(df: pd.DataFrame) -> pd.DataFrame:
            def get_per_image(url: str) -> bytes:
                if not validators.url(url):
                    return math.nan
                return '<img src="' + url + '" width="60" >'
            df['liu'] = [get_per_image(url) for url in df['liu']]
            df['pi'] = [get_per_image(url) for url in df['pi']]
            return df

        def remove_dups(df: pd.DataFrame) -> pd.DataFrame:
            return df.drop_duplicates(subset=['lu'], keep='first')

        dfs: list[pd.DataFrame] = (pd.DataFrame(r['items'])
                                   for r in responses)
        df: pd.DataFrame = pd.concat(dfs, ignore_index=True)

        if df.empty:
            print(f'No results found for search term: {self.search_term}')
            print("Completed")
            exit()

        df: pd.DataFrame = drop_irr_cols(df)
        df: pd.DataFrame = parse_datetime(df)
        df: pd.DataFrame = process_links(df)
        df: pd.DataFrame = process_images(df)
        df: pd.DataFrame = remove_dups(df)
        return df

    def save(self, df: pd.DataFrame) -> None:
        df.columns = ['Similarity Score', 'Open Chat Name',
                      'Open Chat Share Link', 'Password Locked?',
                      'Description', 'Open Chat Profile Picture',
                      'Member Count', 'Open Chat Admin',
                      'Admin Profile Picture', 'Search Hashtags',
                      'Last Message Sent At', 'Likes Count']
        df.to_csv(self.csv_out, index=False)
        df.to_html(self.html_out, index=False, escape=False)
        print(f"Results saved to {self.csv_out} and {self.html_out}")


class ArgumentParser:

    def __init__(self) -> None:
        parser = argparse.ArgumentParser()
        parser.add_argument('search',
                            metavar='SEARCH',
                            type=str,
                            help='Kakao Open Chat Search Term')
        self.args = parser.parse_args()

    def get_search(self):
        return self.args.search


def main() -> None:

    search: str = ArgumentParser().get_search()
    kakao: Kakao = Kakao(search)

    print("Kakao Open Chat Scraper by @choonyy")
    kakao.check_resource_available()
    results: pd.DataFrame = asyncio.run(kakao.get())
    print(f"Number of Groups Found: {len(results)}")
    kakao.save(results)


if __name__ == '__main__':
    main()
