import React from "react";
import * as qs from "query-string";
import {api_server} from "../../UtilityComponents/ConfigData";
import 'fontsource-roboto';
import {
    createViewState,
    JBrowseLinearGenomeView,
} from '@jbrowse/react-linear-genome-view';

class GenomeBrowser extends React.Component {

    constructor(props) {
        super(props);
    }

    assembly = () => {
        return {
            assemblies: [{
                name: "hg19",
                aliases: ["GRCh37"],
                sequence: {
                    type: "ReferenceSequenceTrack",
                    trackId: "refseq_track",
                    adapter: {
                        type: "BgzipFastaAdapter",
                        fastaLocation: {uri: "https://jbrowse.org/genomes/hg19/fasta/hg19.fa.gz"},
                        faiLocation: {uri: "https://jbrowse.org/genomes/hg19/fasta/hg19.fa.gz.fai"},
                        gziLocation: {uri: "https://jbrowse.org/genomes/hg19/fasta/hg19.fa.gz.gzi"}
                    },
                    rendering: {type: "DivSequenceRenderer"}
                },
                refNameAliases: {
                    adapter: {
                        type: "RefNameAliasAdapter",
                        location: {"uri": "https://s3.amazonaws.com/jbrowse.org/genomes/hg19/hg19_aliases.txt"}
                    }
                }
            }]
        };
    }

    tracks = () => {
        return [{
            type: "ReferenceSequenceTrack",
            trackId: "refseq_track",
            adapter: {
                type: "BgzipFastaAdapter",
                fastaLocation: {"uri": "https://jbrowse.org/genomes/hg19/fasta/hg19.fa.gz"},
                faiLocation: {"uri": "https://jbrowse.org/genomes/hg19/fasta/hg19.fa.gz.fai"},
                gziLocation: {"uri": "https://jbrowse.org/genomes/hg19/fasta/hg19.fa.gz.gzi"}
            },
            rendering: {type: "DivSequenceRenderer"}
        }];
    }

    defaultSession = () => {
        return {
            name: 'My session',
            view: {
                id: 'linearGenomeView',
                type: 'LinearGenomeView',
                tracks: [
                    {
                        type: 'ReferenceSequenceTrack',
                        configuration: 'refseq_track',
                        displays: [
                            {
                                type: 'LinearReferenceSequenceDisplay',
                                configuration:
                                    'GRCh38-ReferenceSequenceTrack-LinearReferenceSequenceDisplay',
                            },
                        ],
                    },
                    {
                        type: 'FeatureTrack',
                        configuration: 'ncbi_refseq_109_hg38',
                        displays: [
                            {
                                type: 'LinearBasicDisplay',
                                configuration: 'ncbi_refseq_109_hg38-LinearBasicDisplay',
                            },
                        ],
                    },
                ],
            },
        };
    }

    render() {
        const assembly = this.assembly();
        const tracks = this.tracks();
        const defaultSession = this.defaultSession();
        const state = createViewState({
    assembly,
    tracks,
    defaultSession: {
      ...defaultSession,
      view: {
        ...defaultSession.view,
        bpPerPx: 0.1,
        offsetPx: 10000,
        tracks: [
          {
            id: 'q3UA86xQA',
            type: 'ReferenceSequenceTrack',
            configuration: 'volvox_refseq',
            displays: [
              {
                id: '6JCCxQScPJ',
                type: 'LinearReferenceSequenceDisplay',
                configuration: 'volvox_refseq-LinearReferenceSequenceDisplay',
                height: 210,
              },
            ],
          },
        ],
      },
    },
    configuration: {
      theme: {
        palette: {
          primary: {
            main: '#311b92',
          },
          secondary: {
            main: '#0097a7',
          },
          tertiary: {
            main: '#f57c00',
          },
          quaternary: {
            main: '#d50000',
          },
          bases: {
            A: { main: '#98FB98' },
            C: { main: '#87CEEB' },
            G: { main: '#DAA520' },
            T: { main: '#DC143C' },
          },
        },
      },
    },
  });
        return (
            < JBrowseLinearGenomeView viewState={state}/>
        )
    }
}

export default GenomeBrowser;