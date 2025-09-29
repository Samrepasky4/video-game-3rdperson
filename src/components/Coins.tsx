import { Fragment } from 'react';
import type { CoinDescriptor } from '../types';
import { Coin } from './Coin';

type CoinsProps = {
  coins: CoinDescriptor[];
  collected: Set<number>;
};

export const Coins = ({ coins, collected }: CoinsProps) => (
  <Fragment>
    {coins.map((coin) => (
      <Coin key={coin.id} data={coin} collected={collected.has(coin.id)} />
    ))}
  </Fragment>
);
