import React from "react";
import 'fontsource-roboto';
import {
    createViewState,
    JBrowseLinearGenomeView
} from '@jbrowse/react-linear-genome-view';
import {api_server} from "../../UtilityComponents/ConfigData";
import './GenomeBrowser.css';
import InfoDialog from "../../UtilityComponents/InfoDialog";

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
        return [
            {
                "type": "FeatureTrack",
                "trackId": "Homo_sapiens.GRCh37.87.chr_sorted.gff3.gz",
                "name": "Ensembl Features",
                "category": [
                    "Annotation"
                ],
                "assemblyNames": [
                    "GRCh37"
                ],
                "adapter": {
                    "type": "Gff3TabixAdapter",
                    "gffGzLocation": {
                        "uri": this.state.configData.api_server + "JBrowseData/Homo_sapiens.GRCh37.87.chr_sorted.gff3.gz"
                    },
                    "index": {
                        "location": {
                            "uri": this.state.configData.api_server + "JBrowseData/Homo_sapiens.GRCh37.87.chr_sorted.gff3.gz.tbi"
                        },
                        "indexType": "TBI"
                    },
                    "renderer": {
                        "type": "SvgFeatureRenderer"
                    }
                },
                // "textSearching": {
                //     "textSearchAdapter": {
                //         "type": "TrixTextSearchAdapter",
                //         "textSearchAdapterId": "gene_track-index",
                //         "ixFilePath": {
                //             "uri": this.state.configData.api_server + "JBrowseData/trix/gene_track.ix",
                //             "locationType": "UriLocation"
                //         },
                //         "ixxFilePath": {
                //             "uri": this.state.configData.api_server + "JBrowseData/trix/gene_track.ixx",
                //             "locationType": "UriLocation"
                //         },
                //         "metaFilePath": {
                //             "uri": this.state.configData.api_server + "JBrowseData/trix/gene_track_meta.json",
                //             "locationType": "UriLocation"
                //         },
                //         "assemblyNames": [
                //             "GRCh37"
                //         ]
                //     }
                // }
            },
            {
                "type": "FeatureTrack",
                "trackId": "IMPC_Genes.gff3.gz",
                "name": "IMPC Genes",
                "category": [
                    "Annotation"
                ],
                "assemblyNames": [
                    "GRCh37"
                ],
                "adapter": {
                    "type": "Gff3TabixAdapter",
                    "gffGzLocation": {
                        "uri": this.state.configData.api_server + "JBrowseData/IMPC_Genes.gff3.gz"
                    },
                    "index": {
                        "location": {
                            "uri": this.state.configData.api_server + "JBrowseData/IMPC_Genes.gff3.gz.csi"
                        },
                        "indexType": "CSI"
                    },
                    "renderer": {
                        "type": "SvgFeatureRenderer"
                    }
                },
                // "textSearching": {
                //     "textSearchAdapter": {
                //         "type": "TrixTextSearchAdapter",
                //         "textSearchAdapterId": "impc_gene_track-index",
                //         "ixFilePath": {
                //             "uri": this.state.configData.api_server + "JBrowseData/trix/impc_gene_track.ix",
                //             "locationType": "UriLocation"
                //         },
                //         "ixxFilePath": {
                //             "uri": this.state.configData.api_server + "JBrowseData/trix/impc_gene_track.ixx",
                //             "locationType": "UriLocation"
                //         },
                //         "metaFilePath": {
                //             "uri": this.state.configData.api_server + "JBrowseData/trix/impc_gene_track_meta.json",
                //             "locationType": "UriLocation"
                //         },
                //         "assemblyNames": [
                //             "GRCh37"
                //         ]
                //     }
                // }
            },
            {
                "type": "VariantTrack",
                "trackId": "homo_sapiens_phenotype_associated.vcf.gz",
                "name": "Ensembl Variants",
                "category": [
                    "Annotation"
                ],
                "assemblyNames": [
                    "GRCh37"
                ],
                "adapter": {
                    "type": "VcfTabixAdapter",
                    "vcfGzLocation": {
                        "uri": this.state.configData.api_server + "JBrowseData/homo_sapiens_phenotype_associated.vcf.gz"
                    },
                    "index": {
                        "indexType": "TBI",
                        "location": {
                            "uri": this.state.configData.api_server + "JBrowseData/homo_sapiens_phenotype_associated.vcf.gz.tbi"
                        }
                    }
                },
                // "textSearching": {
                //     "textSearchAdapter": {
                //         "type": "TrixTextSearchAdapter",
                //         "textSearchAdapterId": "variant_track-index",
                //         "ixFilePath": {
                //             "uri": this.state.configData.api_server + "JBrowseData/trix/variant_track.ix",
                //             "locationType": "UriLocation"
                //         },
                //         "ixxFilePath": {
                //             "uri": this.state.configData.api_server + "JBrowseData/trix/variant_track.ixx",
                //             "locationType": "UriLocation"
                //         },
                //         "metaFilePath": {
                //             "uri": this.state.configData.api_server + "JBrowseData/trix/variant_track_meta.json",
                //             "locationType": "UriLocation"
                //         },
                //         "assemblyNames": [
                //             "GRCh37"
                //         ]
                //     }
                // }
            },
            {
                "type": "VariantTrack",
                "trackId": "GC_only_variants.vcf.gz",
                "name": "GWAS Central Variants",
                "category": [
                    "Annotation"
                ],
                "assemblyNames": [
                    "GRCh37"
                ],
                "adapter": {
                    "type": "VcfTabixAdapter",
                    "vcfGzLocation": {
                        "uri": this.state.configData.api_server + "JBrowseData/GC_only_variants.vcf.gz"
                    },
                    "index": {
                        "indexType": "CSI",
                        "location": {
                            "uri": this.state.configData.api_server + "JBrowseData/GC_only_variants.vcf.gz.csi"
                        }
                    }
                },
                "displays": [
                    {
                        "type": "LinearVariantDisplay",
                        "displayId": "GC_only_variants.vcf.gz-LinearVariantDisplay",
                        "maxDisplayedBpPerPx": 3000
                    }
                ],

                // "textSearching": {
                //     "textSearchAdapter": {
                //         "type": "TrixTextSearchAdapter",
                //         "textSearchAdapterId": "gc_variant_track-index",
                //         "ixFilePath": {
                //             "uri": this.state.configData.api_server + "JBrowseData/trix/gc_variant_track.ix",
                //             "locationType": "UriLocation"
                //         },
                //         "ixxFilePath": {
                //             "uri": this.state.configData.api_server + "JBrowseData/trix/gc_variant_track.ixx",
                //             "locationType": "UriLocation"
                //         },
                //         "metaFilePath": {
                //             "uri": this.state.configData.api_server + "JBrowseData/trix/gc_variant_track_meta.json",
                //             "locationType": "UriLocation"
                //         },
                //         "assemblyNames": [
                //             "GRCh37"
                //         ]
                //     }
                // }
            }
        ];
    }

    textSearchConfig = () => {
        return [
            {
                type: 'TrixTextSearchAdapter',
                textSearchAdapterId: 'hg19-index',
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
                                height: 80,
                                configuration:
                                    'assembly_track-LinearReferenceSequenceDisplay',
                            },
                        ],
                    },
                    {
                        type: 'FeatureTrack',
                        configuration: 'IMPC_Genes.gff3.gz',
                        displays: [
                            {
                                type: 'LinearBasicDisplay',
                                height: 200,
                                configuration:
                                    'IMPC_Genes.gff3.gz-LinearBasicDisplay',
                                maxDisplayedBpPerPx: 3000
                            }
                        ]
                    },
                    {
                        type: "VariantTrack",
                        configuration: "GC_only_variants.vcf.gz",
                        displays: [
                            {
                                type: "LinearVariantDisplay",
                                height: 200,
                                configuration: "GC_only_variants.vcf.gz-LinearVariantDisplay",
                                maxDisplayedBpPerPx: 300000
                            }
                        ],
                    }
                ],
                hideHeader: false,
                hideCloseButton: true,
                hideControls: false,
                trackSelectorType: "hierarchical"
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
        // this.nv.addEventListener("click", (e) => {
        //     console.log(e);
        // });
    }

    navTo = (loc) => {
        this.viewState.session.view.zoomTo(loc);
    }


    render() {
        return <div>
            <JBrowseLinearGenomeView ref={elem => this.nv = elem} viewState={this.viewState}/>
        </div>;
    }
}

export default GenomeBrowser;