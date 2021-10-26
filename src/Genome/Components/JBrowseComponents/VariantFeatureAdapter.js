import { VcfTabixAdapter } from '@jbrowse/plugin-variants/dist/VcfTabixAdapter';
import SimpleFeature from '@jbrowse/core/util/simpleFeature';
import { readConfObject } from '@jbrowse/core/configuration';
import { ObservableCreate } from '@jbrowse/core/util/rxjs';


class VariantFeatureAdapter extends VcfTabixAdapter {
  constructor(config, getSubAdapter) {
    super();
    this.fileLocation = readConfObject(config, 'fileLocation');
    this.subadapter = readConfObject(config, 'sequenceAdapter');
    this.sequenceAdapter = getSubAdapter(this.subadapter);
    // config
  }
  // use rxjs observer.next(new SimpleFeature(...your feature data....) for each
  // feature you want to return
  getFeatures(region, options) {
    return ObservableCreate(async observer => {
      try {
        const { refName, start, end } = region
        const response = await fetch(
          'http://myservice/genes/${refName}/${start}-${end}',
          options,
        );
        if (response.ok) {
          const features = await response.json();
          features.forEach(feature => {
            observer.next(
              new SimpleFeature({
                uniqueID: `${feature.refName}-${feature.start}-${feature.end}`,
                refName: feature.refName,
                start: feature.start,
                end: feature.end,
              }),
            )
          })
          observer.complete()
        } else {
          throw new Error(`${response.status} - ${response.statusText}`)
        }
      } catch (e) {
        observer.error(e)
      }
    })
  }

  async getRefNames() {
    // returns the list of refseq names in the file, used for refseq renaming
    // you can hardcode this if you know it ahead of time e.g. for your own
    // remote data API or fetch this from your data file e.g. from the bam header
    return ['chr1', 'chr2', 'chr3'] /// etc
  }

  freeResources(region) {
    // optionally remove cache resources for a region
    // can just be an empty function
  }
}

export default VariantFeatureAdapter;