/**
 * All data is in JSON:API format with simple values under the
 * `attributes` property and links to other objects under the
 * `relationships` property. Example:
 * 
 * {
 *  "id": "0",
 *  "type": "publication",
 *  "attributes": {
 *    "volume": "23",
 *    "issue": "7",
 *    "pmid": "25820114",
 *    "title": "Is There Excess Oxidative Stress and Damage in Eyes of Patients with Retinitis Pigmentosa?",
 *    "doi": "10.1089/ars.2015.6327"
 *   }
 * }
 */
module.exports = class PassRemapper {
  _cache = new Map();

  _emptyObj(obj) {
    return !!obj
      && Object.keys(obj).length === 0
      && Object.getPrototypeOf(obj) === Object.prototype;
  }

  _copyObject(obj) {
    return Object.assign({}, obj);
  }

  cacheId(obj) {
    return `${obj.type}:${obj.id}`;
  }

  responseId(obj) {
    return obj.data.id;
  }

  /**
   * Cache the orig => backend IDs
   * @param orig original data object
   * @param resp response from backend
   */
  add(orig, resp) {
    const id = this.cacheId(orig);
    const respId = this.responseId(resp);
    this._cache.set(id, respId);
  }

  /**
   * Get the backend ID for the given original object
   * @param orig original data object
   */
  getIdFor(orig) {
    const id = this.cacheId(orig);
    return this._cache.get(id);
  }

  /**
   * Update the relationship IDs for objects to use
   * backend IDs
   * 
   * {
   *    "relationships": {
   *      "journal": {
   *        "data": { "id": "", "type": "" }
   *        // OR
   *        "data": [ { "id": "", "type": "" }, ... ]
   *      }
   *    }
   * }
   * 
   * @param obj original data object
   * @returns data object with updated relationship IDs
   */
  updateRelationships(obj) {
    const copy = this._copyObject(obj);
    
    if (!copy.relationships) {
      return obj;
    }

    for (const key of Object.keys(copy.relationships)) {
      const link = copy.relationships[key];
      const backId = this.getIdFor(link);
      
      let newData;
      if (!link || !link.data) {
        continue;
      } else if (Array.isArray(link.data)) {
        const copyLinks = [];
        for (let data of link.data) {
          copyLinks.push({
            id: this.getIdFor(data),
            type: data.type
          });
        }
        newData = copyLinks;
      } else {
        newData = {
          id: this.getIdFor(link.data),
          type: link.data.type
        };
      }

      copy.relationships[key].data = newData;
    }

    return copy;
  }
}
