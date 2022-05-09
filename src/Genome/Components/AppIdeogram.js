import React, {Component} from "react";
import Ideogram from "ideogram";
import './AppIdeogram.css'
import {Button, FormControl, InputLabel, MenuItem, Select, withStyles} from "@material-ui/core";
import {api_server} from "../../UtilityComponents/ConfigData";
import {d3} from "ideogram/src/js/lib";

const useStyles = theme => ({
    formControl: {
        margin: theme.spacing(1),
        minWidth: "6em",
        textAlign: "center"
    },
    selectEmpty: {
        marginTop: theme.spacing(2),
    },
    autoComplete: {
        width: "50%",
        marginLeft: "auto",
        marginRight: "auto",
    },
    radio: {
        width: "50%",
        marginLeft: "auto",
        marginRight: "auto"
    },
});


class AppIdeogram extends Component {

    constructor(props) {
        super(props);
        this.state = {
            openChromosome: null,
            markerPval: 0,
            knockoutPval: 0,
            configData: api_server,
        }
        this.ideogram = null;
    }

    componentDidMount() {
        this.getIdeogram();
    }

    getShape() {
        let annotHeight = 5.5;
        return 'm0,0 l 0 ' + (2 * annotHeight) +
            'l ' + annotHeight / 2 + ' 0' +
            'l 0 -' + (2 * annotHeight) + 'z';
    }

    getIdeogram = () => {
        this.ideogram = null;
        if (this.props.markerData) {
            this.ideogram = new Ideogram({
                organism: 'human',
                assembly: "GRCh37",
                container: ".ideo-container",
                orientation: 'vertical',
                filterable: true,
                rotatable: false,
                chrWidth: 15,
                chrHeight: 600,
                annotations: this.props.markerData,
                onClickAnnot: this.props.onAnnotationClick,
                onLoad: () => this.filterAnnots(0, 0),
                annotationTracks: [
                    {id: 'markerTrack', displayName: 'Markers', shape: this.getShape()},
                    {id: 'knockoutTrack', displayName: 'Knockouts', shape: this.getShape()}
                ],
                annotationHeight: 7.5,
            });
        }
        return this.ideogram;
    }


    expandIdeogram = (self) => {
        self.setState({openChromosome: null});
    }

    getAnnotationTracks = () => {
        return [
            {id: 'humanMarkerTrack', displayName: 'Human Markers'},
            {id: "mouseKnockoutTrack", displayName: "Mouse Knockouts"}
        ];
    }

    getHeatmapLegend = () => {
        return [
            {
                name: "Marker Significance",
                rows: [
                    {color: '#88F', name: "Below " + (this.props.marker_avg + 1).toString()},
                    {
                        color: '#ff8200', name: "Between " + (this.props.marker_avg - 1).toString() + " & " +
                            (this.props.marker_avg + 1).toString()
                    },
                    {color: '#F33', name: "Above " + (this.props.marker_avg + 1).toString()}
                ]
            },
        ];
    }

    getHeatmaps = () => {
        return [
            {
                key: 'Marker Significance',
                thresholds: [
                    ["Below " + (this.props.marker_avg + 1).toString(), '#88F'],
                    ["Between " + (this.props.marker_avg - 1).toString() + " " + (this.props.marker_avg + 1).toString(),
                        '#ff8200'],
                    ["Above " + (this.props.marker_avg + 1).toString(), '#F33']
                ]
            },
        ];
    }


    onKnockoutPvalChange = (newVal) => {
        this.setState({knockoutPval: newVal});
        this.filterAnnots(this.state.markerPval, newVal);
    }

    onMarkerPvalChange = (newVal) => {
        this.setState({markerPval: newVal});
        this.filterAnnots(newVal, this.state.knockoutPval);
    }

    getFilteredAnnots = (markerPval, knockoutPval) => {

        this.ideogram.annotsByFacet["markerSignificance"].filter((val) => {
            return val >= markerPval;
        });

        this.ideogram.annotsByFacet["knockoutSignificance"].filter((val) => {
            return val >= knockoutPval;
        });

        let results = this.ideogram.annotsByFacet[this.ideogram.facets[this.ideogram.facets.length - 2]].top(Infinity);
        return results;
    }

    filterAnnots = (markerPval, knockoutPval) => {
        let results;

        results = this.getFilteredAnnots(markerPval, knockoutPval);

        results = this.ideogram.packAnnots(results);

        delete this.ideogram.maxAnnotsPerBar;
        delete this.ideogram.maxAnnotsPerBarAllChrs;

        this.ideogram.filteredAnnots = results;

        d3.selectAll(this.ideogram.selector + ' polygon.annot').remove();
        this.ideogram.drawAnnots(results);
    }


    render() {
        const {classes} = this.props;
        return (
            <div className="karyotype-control-container">
                {
                    this.state.openChromosome ? <br/> : null
                }
                {
                    this.state.openChromosome ? <Button size="small" color="primary" variant="contained"
                                                        onClick={() => this.expandIdeogram(this)}>Back</Button> : null
                }
                <div className="control-container">
                    <div className="species-controls">
                        <h3>Human Genetic Variants</h3>
                        <FormControl className={classes.formControl}>
                            <InputLabel shrink>-log P-value</InputLabel>
                            <Select value={this.state.markerPval} className={classes.selectEmpty} id="select"
                                    onChange={(e) => this.onMarkerPvalChange(e.target.value)}>
                                <MenuItem value={0}>0</MenuItem>
                                <MenuItem value={1}>1</MenuItem>
                                <MenuItem value={2}>2</MenuItem>
                                <MenuItem value={3}>3</MenuItem>
                                <MenuItem value={4}>4</MenuItem>
                                <MenuItem value={5}>5</MenuItem>
                                <MenuItem value={6}>6</MenuItem>
                                <MenuItem value={7}>7</MenuItem>
                                <MenuItem value={8}>8</MenuItem>
                                <MenuItem value={9}>9</MenuItem>
                                <MenuItem value={10}>10</MenuItem>
                            </Select>
                        </FormControl>
                        <div className="legend">
                            <ul>
                                <li>
                                    <svg width="10" height="10">
                                        <rect width="10" height="10" fill="#0000b8"/>
                                    </svg>
                                    &nbsp;&nbsp;Below Average
                                </li>
                                <li>
                                    <svg width="10" height="10">
                                        <rect width="10" height="10" fill="#31bb22"/>
                                    </svg>
                                    &nbsp;&nbsp;Average ({this.props.marker_avg} markers)
                                </li>
                                <li>
                                    <svg width="10" height="10">
                                        <rect width="10" height="10" fill="#F33"/>
                                    </svg>
                                    &nbsp;&nbsp;Above Average
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="species-controls">
                        <h3>Mouse Gene Knockouts</h3>
                        <FormControl className={classes.formControl}>
                            <InputLabel shrink>-log P-value</InputLabel>
                            <Select value={this.state.knockoutPval} className={classes.selectEmpty} id="select"
                                    onChange={(e) => this.onKnockoutPvalChange(e.target.value)}>
                                <MenuItem value={0}>0</MenuItem>
                                <MenuItem value={1}>1</MenuItem>
                                <MenuItem value={2}>2</MenuItem>
                                <MenuItem value={3}>3</MenuItem>
                                <MenuItem value={4}>4</MenuItem>
                                <MenuItem value={5}>5</MenuItem>
                                <MenuItem value={6}>6</MenuItem>
                                <MenuItem value={7}>7</MenuItem>
                                <MenuItem value={8}>8</MenuItem>
                                <MenuItem value={9}>9</MenuItem>
                                <MenuItem value={10}>10</MenuItem>
                            </Select>
                        </FormControl>
                        <div className="legend">
                            <ul>
                                <li>
                                    <svg width="10" height="10">
                                        <rect width="10" height="10" fill="#0000b8"/>
                                    </svg>
                                    &nbsp;&nbsp;Below Average
                                </li>
                                <li>
                                    <svg width="10" height="10">
                                        <rect width="10" height="10" fill="#31bb22"/>
                                    </svg>
                                    &nbsp;&nbsp;Average ({this.props.knockout_avg} knockouts)
                                </li>
                                <li>
                                    <svg width="10" height="10">
                                        <rect width="10" height="10" fill="#F33"/>
                                    </svg>
                                    &nbsp;&nbsp;Above Average
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>


                <div className="ideo-container"/>
            </div>
        );
    }
}

export default withStyles(useStyles)(AppIdeogram);