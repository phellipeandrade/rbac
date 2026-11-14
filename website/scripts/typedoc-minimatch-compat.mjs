import {Minimatch} from 'minimatch';

// TypeDoc 0.28 ORs matchOne() results across rows; minimatch 11's match()
// already checks all rows, including the partial directory traversal case.
// Remove this bridge once TypeDoc supports minimatch 11 natively.
if (typeof Minimatch.prototype.matchOne !== 'function') {
  Minimatch.prototype.matchOne = function (segments, _row, partial) {
    return this.match(segments.join('/'), partial);
  };
}
