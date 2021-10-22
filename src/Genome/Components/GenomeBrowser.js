import React from "react";
import * as qs from "query-string";
import 'fontsource-roboto';
import {
    createViewState,
    JBrowseLinearGenomeView
} from '@jbrowse/react-linear-genome-view';
import {api_server} from "../../UtilityComponents/ConfigData";

function forceLoadTracks() {

    let btns = document.querySelectorAll("[data-testid=\"reload_button\"]");
    if (btns.length > 0) {
        btns.forEach((btn) => {
            btn.click();
        });
    } else {
        window.setTimeout(() => {
            forceLoadTracks();
        }, 500);
    }
}

class GenomeBrowser extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            configData: api_server
        }
        this.trackNum = 3;
        this.viewState = createViewState(
            {
                configuration: this.configuration(),
                assembly: this.assembly(),
                aggregateTextSearchAdapters: this.textSearchConfig(),
                tracks: this.tracks(),
                defaultSession: this.defaultSession(),
                location: this.props.chrom ? this.props.chrom + ":" + this.props.start + "-" + this.props.stop : "1:1..3,000,000",
            }
        );
    }

    assembly = () => {
        return {
            name: "hg19",
            aliases: ["GRCh37"],
            sequence: {
                type: "ReferenceSequenceTrack",
                trackId: "assembly_track",
                adapter: {
                    type: "BgzipFastaAdapter",
                    fastaLocation: {"uri": this.state.configData.api_server + "JBrowseData/hg19.fa.gz"},
                    faiLocation: {"uri": this.state.configData.api_server + "JBrowseData/hg19.fa.gz.fai"},
                    gziLocation: {"uri": this.state.configData.api_server + "JBrowseData/hg19.fa.gz.gzi"}
                },
                rendering: {type: "DivSequenceRenderer"}
            },
            refNameAliases: {
                adapter: {
                    type: "RefNameAliasAdapter",
                    location: {uri: this.state.configData.api_server + "JBrowseData/hg19_aliases.txt"}
                }
            }
        };
    }

    tracks = () => {
        return [{
            type: "ReferenceSequenceTrack",
            trackId: "refseq_track",
            adapter: {
                type: "BgzipFastaAdapter",
                fastaLocation: {"uri": this.state.configData.api_server + "JBrowseData/hg19.fa.gz"},
                faiLocation: {"uri": this.state.configData.api_server + "JBrowseData/hg19.fa.gz.fai"},
                gziLocation: {"uri": this.state.configData.api_server + "JBrowseData/hg19.fa.gz.gzi"}
            },
            rendering: {type: "DivSequenceRenderer"}
        },
            {
                type: 'FeatureTrack',
                trackId: 'gene_track',
                name: 'Ensembl Features',
                category: ['Annotation'],
                assemblyNames: ['GRCh37'],
                adapter: {
                    type: 'Gff3TabixAdapter',
                    gffGzLocation: {uri: this.state.configData.api_server + 'JBrowseData/Homo_sapiens.GRCh37.87.chr_sorted.gff3.gz',},
                    index: {
                        location: {uri: this.state.configData.api_server + 'JBrowseData/Homo_sapiens.GRCh37.87.chr_sorted.gff3.gz.tbi',},
                        indexType: 'TBI',
                    },
                    renderer: {type: 'SvgFeatureRenderer',},
                },
            },
            {
                type: 'FeatureTrack',
                trackId: 'impc_gene_track',
                name: 'IMPC Genes',
                category: ['Annotation'],
                assemblyNames: ['GRCh37'],
                adapter: {
                    type: 'Gff3TabixAdapter',
                    gffGzLocation: {uri: this.state.configData.api_server + 'JBrowseData/IMPC_Genes.gff3.gz',},
                    index: {
                        location: {uri: this.state.configData.api_server + 'JBrowseData/IMPC_Genes.gff3.gz.tbi',},
                        indexType: 'TBI',
                    },
                    renderer: {type: 'SvgFeatureRenderer',},
                },
            },
            {
                type: 'VariantTrack',
                trackId: 'variant_track',
                name: 'Ensembl Variants',
                category: ['Annotation'],
                assemblyNames: ['GRCh37'],
                adapter: {
                    type: 'VcfTabixAdapter',
                    vcfGzLocation: {uri: this.state.configData.api_server + 'JBrowseData/homo_sapiens_phenotype_associated.vcf.gz',},
                    index: {
                        indexType: "TBI",
                        location: {uri: this.state.configData.api_server + 'JBrowseData/homo_sapiens_phenotype_associated.vcf.gz.tbi',},
                    },
                },
            },
            {
                type: 'VariantTrack',
                trackId: 'gc_variant_track',
                name: 'GWAS Central Variants',
                category: ['Annotation'],
                assemblyNames: ['GRCh37'],
                adapter: {
                    type: 'VcfTabixAdapter',
                    vcfGzLocation: {uri: this.state.configData.api_server + 'JBrowseData/GC_only_variants.vcf.gz',},
                    index: {
                        indexType: "TBI",
                        location: {uri: this.state.configData.api_server + 'JBrowseData/GC_only_variants.vcf.gz.tbi',},
                    },
                },
                displays: [
                    {
                        type: "LinearVariantDisplay",
                        displayId: "gc_variant_track-LinearVariantDisplay",
                        maxDisplayedBpPerPx: 3000
                    }
                ]
            },
        ];
    }

    textSearchConfig = () => {
        return [
      {
        type: 'TrixTextSearchAdapter',
        textSearchAdapterId: 'gc-index',
        ixFilePath: {
          uri: this.state.configData.api_server + 'JBrowseData/trix/aggregate.ix',
          locationType: 'UriLocation',
        },
        ixxFilePath: {
          uri: this.state.configData.api_server + 'JBrowseData/trix/aggregate.ixx',
          locationType: 'UriLocation',
        },
        metaFilePath: {
          uri: this.state.configData.api_server + 'JBrowseData/trix/aggregate_meta.json',
          locationType: 'UriLocation',
        },
        assemblyNames: ['hg19'],
      },
    ];
    }

    defaultSession = () => {
        return {
            name: 'Default Session',
            view: {
                id: 'linearGenomeView',
                type: 'LinearGenomeView',
                tracks: [
                    {
                        type: 'ReferenceSequenceTrack',
                        configuration: 'assembly_track',
                        displays: [
                            {
                                type: 'LinearReferenceSequenceDisplay',
                                configuration:
                                    'refseq_track-LinearReferenceSequenceDisplay',
                            },
                        ],
                    },
                    {
                        type: 'FeatureTrack',
                        configuration: 'impc_gene_track',
                        displays: [
                            {
                                type: 'LinearBasicDisplay',
                                height: 200,
                                configuration:
                                    'gene_track-LinearBasicDisplay',
                                maxDisplayedBpPerPx: 3000
                            }
                        ]
                    },
                    {
                        type: "VariantTrack",
                        configuration: "gc_variant_track",
                        displays: [
                            {
                                type: "LinearVariantDisplay",
                                height: 200,
                                configuration: "variant_track-LinearVariantDisplay",
                                maxDisplayedBpPerPx: 300000
                            }
                        ],
                    }
                ],
                hideHeader: false,
                hideCloseButton: true,
                hideControls: false,
                trackSelectorType: "hierarchical",
            },
        };
    }

    configuration = () => {
        return {
            theme: {
                palette: {
                    primary: {
                        main: '#311b92',
                    },
                    secondary: {
                        main: '#004ba7',
                    },
                    tertiary: {
                        main: '#f57c00',
                    },
                    quaternary: {
                        main: '#d50000',
                    },
                    bases: {
                        A: {main: '#98FB98'},
                        C: {main: '#87CEEB'},
                        G: {main: '#DAA520'},
                        T: {main: '#DC143C'},
                    },
                },
            },
            disableAnalytics: true,

        };
    };


    componentDidMount() {
        forceLoadTracks();
    }

    navTo = (loc) => {
        this.viewState.session.view.zoomTo(loc);

    }

    render() {
        return < JBrowseLinearGenomeView viewState={this.viewState}/>;
    }
}

export default GenomeBrowser;