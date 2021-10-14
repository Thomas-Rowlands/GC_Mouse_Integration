import React, {Component} from "react";
import Ideogram from "ideogram";
import './AppIdeogram.css'
import {Button, FormControl, InputLabel, MenuItem, Select, Typography, withStyles} from "@material-ui/core";
import $ from "jquery";
import {api_server} from "../../UtilityComponents/ConfigData";

const useStyles = theme => ({
    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
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
        this.annots = this.props.markerData;
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
        if (this.annots) {
            this.ideogram = new Ideogram({
                organism: 'human',
                assembly: "GRCh37",
                container: ".ideo-container",
                orientation: 'vertical',
                filterable: true,
                rotatable: false,
                chrWidth: 15,
                chrHeight: 600,
                annotations: this.annots,
                onClickAnnot: this.props.onAnnotationClick,
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

    getFilterSelection = (isMarkerPval, newVal) => {
        let filter = {"markerSignificance": {}, "knockoutSignificance": {}};
        let marker = isMarkerPval ? newVal : this.state.markerPval;
        let knockout = isMarkerPval ? this.state.knockoutPval : newVal;
        for (let i = 0; i < 11; i++) {
            if (i >= marker)
                filter["markerSignificance"][i] = 1;
            if (i >= knockout)
                filter["knockoutSignificance"][i] = 1;
        }
        return filter;
    }

    onKnockoutPvalChange = (newVal) => {
        this.setState({knockoutPval: newVal});
        let selection = this.getFilterSelection(false, newVal);
        this.ideogram.filterAnnots(selection);
    }

    onMarkerPvalChange = (newVal) => {
        this.setState({markerPval: newVal});
        let selection = this.getFilterSelection(true, newVal);
        this.ideogram.filterAnnots(selection);
    }

    render() {
        const {classes} = this.props;
        return (
            <div>
                {

                    this.state.openChromosome ? <br/> : null
                }
                {
                    this.state.openChromosome ? <Button size="small" color="primary" variant="contained"
                                                        onClick={() => this.expandIdeogram(this)}>Back</Button> : null
                }
                <div className="center">
                    <FormControl className={classes.formControl}>
                        <InputLabel shrink>Marker P-value</InputLabel>
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
                    <FormControl className={classes.formControl}>
                        <InputLabel shrink>Knockout P-value</InputLabel>
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
                </div>

                <div className="ideo-container"/>
                <div className="legend">
                    <div>
                        <h3>Markers</h3>
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
                    <div>
                        <h3>Knockouts</h3>
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
        );
    }
}

export default withStyles(useStyles)(AppIdeogram);