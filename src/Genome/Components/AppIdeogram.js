import React, {Component} from "react";
import Ideogram from "ideogram";
import './AppIdeogram.css'
import {Button, FormControl, InputLabel, MenuItem, Select, withStyles} from "@material-ui/core";
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
                rotatable: false,
                chrWidth: 15,
                chrHeight: 600,
                annotations: this.props.markerData,
                onClickAnnot: this.props.onAnnotationClick,
                annotationTracks: [
                    {id: 'markerTrack', displayName: 'Markers', shape: this.getShape()},
                    {id: 'knockoutTrack', displayName: 'Knockouts', shape: this.getShape()}
                ],
                annotationHeight: 7.5,
                legend: this.getHeatmapLegend(),
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
                    {color: '#ff8200', name: "Between " + (this.props.marker_avg - 1).toString() + " & " + (this.props.marker_avg + 1).toString()},
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
                    ["Between " + (this.props.marker_avg - 1).toString() + " " + (this.props.marker_avg + 1).toString(), '#ff8200'],
                    ["Above " + (this.props.marker_avg + 1).toString(), '#F33']
                ]
            },
        ];
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
                                onChange={(e) => this.setState({brushMarkerPval: e.target.value})}>
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
                                onChange={(e) => this.setState({brushMarkerPval: e.target.value})}>
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
            </div>
        );
    }
}

export default withStyles(useStyles)(AppIdeogram);