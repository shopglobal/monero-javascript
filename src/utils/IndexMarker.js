const assert = require("assert");
const GenUtils = require("../utils/GenUtils");

/**
 * Allows indices in an infinite range to be arbitrarily marked or not marked.
 * 
 * TODO: compress into ranges to be more efficient
 * TODO: public set(isMarked, start, end) with example usage in documentation and tests
 *  set(true, 0);
 *  set(true, 0, 4);
 *  set(true, [0, 1, 2, 3, 4]);
 */
class IndexMarker {
  
  /**
   * Constructs the marker.
   * 
   * @param stateOrMarker is an initial state or marker to copy (optional)
   */
  constructor(stateOrMarker) {
    if (stateOrMarker instanceof IndexMarker) this.setState(GenUtils.copyProperties(stateOrMarker.getState()));
    else if (stateOrMarker) this.setState(stateOrMarker);
    else this.reset();
  }
  
  /**
   * Get the internal state of the marker.
   */
  getState() {
    return this.state;
  }
  
  /**
   * Set the internal state of the marker.
   * 
   * @param state is the state to set
   * @returns this instance for convenience
   */
  setState(state) {
    IndexMarker._validateState(state);
    delete this.state;
    this.state = state;
    return this;
  }
  
  /**
   * Resets everything to unmarked.
   * 
   * @returns this instance for convenience
   */
  reset() {
    delete this.state;
    this.state = {};
    return this;
  }
  
  /**
   * Sets the mark status at one or more indices.
   * 
   * @param mark specifies if the given indices should be marked or not
   * @param start is a number specifying an index or a start or a range or an array of indices to set
   * @param end is a number specifying the end of the range to set (optional)
   * @returns this instance for convenience
   */
  set(mark, start, end) {
    
    // sanitize inputs
    let inputs = IndexMarker._sanitizeInputs(mark, start, end);
    
    // set single or range
    if (inputs.start !== undefined) {
      
      // set range
      if (inputs.end !== undefined) {
        for (let index = inputs.start; index <= inputs.end; index++) {
          this._setSingle(index, mark);
        }
      }
      
      // set single
      else {
        this._setSingle(mark, inputs.start);
      }
    }
    
    // set all or array of indices
    else {
      
      // set indices 
      if (inputs.indices !== undefined) {
        for (let index of inputs.indices) {
          this._setSingle(index, mark);
        }
      }
      
      // set all
      else {
        throw new Error("Not implemented");
      }
    }
  }
  
  /**
   * Marks one or more indices.
   * 
   * @param start is a number specifying an index or a start of a range or an array of indices to mark
   * @param end is a number specifying the end of the range to mark (optional)
   * @returns this instance for convenience
   */
  mark(start, end) {
    return this.set(true, start, end);
  }

  /**
   * Unmarks one or more indices.
   * 
   * @param start is a number specifying an index or a start of a range or an array of indices to unmark
   * @param end is a number specifying the end of the range to unmark (optional)
   * @returns this instance for convenience
   */
  unmark(start, end) {
    return this.set(false, start, end);
  }
  
  /**
   * Indicates if all specified indices are marked (true), unmarked (false),
   * or some are marked and some are not marked (undefined).
   * 
   * @param start is a number specifying an index or a start of a range or an array of indices to check
   * @param end is a number specifying the end of the range to check (optional)
   * @returns true iff all indices are marked, false iff all indices are not marked, undefined otherwise
   */
  isMarked(start, end) {
    
    // sanitize inputs
    let inputs = IndexMarker._sanitizeInputs(null, start, end);
    
    throw new Error("Not implemented");
    
//    // check single or range
//    if (inputs.start !== undefined) {
//      
//      // check range
//      if (inputs.end !== undefined) {
//        let marked;
//        for (let index = inputs.start; index <= inputs.end; index++) {
//          if (marked === undefined) marked = this.isMarked(index)
//          else if (marked !== this.isMarked(index)) return undefined;
//        }
//        return marked;
//      }
//      
//      // check single index
//      else {
//        let marked = this.state.get(inputs.start) === true;
//        if (this.state.inverted) marked = !marked;
//        return marked;
//      }
//    }
//    
//    // check indices provided by an array
//    else {
//      assert(inputs.indices);
//      let marked;
//      for (let index of inputs.indices) {
//        if (marked === undefined) marked = this.isMarked(index)
//        else if (marked !== this.isMarked(index)) return undefined;
//      }
//      return marked;
//    }
  }
  
  invert() {
    this.state.inverted = !this.state.inverted;
    this.state.set("inverted", !this.state.inverted);
    return this;
  }
  
  copy() {
    return new IndexMarker(this);
  }
  
  /**
   * Gets the first index with the given marked state.
   * 
   * @param isMarked specifies if the index to find should be marked or unmarked
   * @param start is the start index to search from (optional)
   * @param end is the end index to search from (optional)
   */
  getFirst(isMarked, start = 0, end) {
    
    throw new Error("Not implemented");
    
    // validate inputs
    assert(typeof isMarked === "boolean");
    assert(start === undefined || start >= 0);
    if (end !== undefined) {
      assert(start !== undefined);
      assert(end >= start);
    }
    
    // get sorted keys TODO: expensive
    let keys = [...this.state.keys()];
    keys.splice(keys.indexOf("inverted"), 1);
    let sortedIndices = keys.sort((a, b) => a === b ? 0 : a > b ? 1 : -1);
    
    // find first index within range
    let firstIdx = start;
    for (let idx of sortedIndices) {
      if (idx < start) continue;
      if (end !== undefined && idx > end) continue;
      if (this.isMarked(idx) === isMarked) return idx;
      else if (idx !== firstIdx) break;
      else firstIdx = idx + 1;
    }
    
    // return first index within range
    if (end !== undefined && firstIdx > end) return null;
    if (this.isMarked(firstIdx) !== isMarked) return null;
    return firstIdx;
  }
  
  // --------------------------------- PRIVATE --------------------------------
  
  _setSingle(index, mark) {
    if (!this.state.inverted) {
      if (mark) this.state.set(index, true);
      else this.state.delete(index)
    } else {
      if (mark) this.state.delete(index);
      else this.state.set(index, true);
    }
  }
  
  static _validateState(state) {
    assert(state);
    assert(state instanceof Object)
    assert(state.inverted === undefined || typeof state.inverted === "boolean");
    assert(state.ranges !== undefined);
    assert(Array.isArray(state.ranges));
    for (let range of state.ranges) {
      assert(range.start >= 0);
      assert(range.end >= 0);
    }
  }
  
  static _sanitizeInputs(mark, start, end) {
    
    // validate and sanitize inputs
    if (mark !== undefined && mark !== null) assert(typeof mark === "boolean", "Mark is not boolean");
    let indices;
    if (start === undefined) {
      assert(end === undefined);
    } else {
      if (end !== undefined) {
        assert(typeof start === "number");
        assert(start >= 0);
        assert(typeof end === "number");
        assert(end >= start);
      } else {
        if (Array.isArray(start)) {
          indices = start;
          start = undefined;
        } else {
          assert(typeof start === "number");
          assert(start >= 0);
        }
      }
    }
    
    // assign sanitized inputs
    let sanitized = {};
    sanitized.mark = mark;
    sanitized.start = start;
    sanitized.end = end;
    sanitized.indices = indices;
    return sanitized;
  }
}

module.exports = IndexMarker;