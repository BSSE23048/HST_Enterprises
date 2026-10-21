import { renderToString } from 'react-dom/server';
import CorporateSite from './corporate/CorporateSite';
export function render() { return renderToString(<CorporateSite />); }
