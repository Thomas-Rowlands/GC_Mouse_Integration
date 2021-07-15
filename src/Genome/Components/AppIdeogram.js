import React, {Component} from "react";
import Ideogram from "ideogram";
import './AppIdeogram.css'
import {Button, FormControl, InputLabel, MenuItem, Select, withStyles} from "@material-ui/core";
import $ from "jquery";

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
            brushMarkerPval: 0
        }
        this.brushStart = 17487076;
        this.brushStop = 41901071;
        this.brushExtent = 0;
        this.ideogram = null;
    }

    componentDidMount() {
        $("#brush-menu-container").hide();
        this.getIdeogram();
    }


    getIdeogram = () => {
        this.ideogram = null;
        if (this.props.markerData) {
            if (this.state.openChromosome) {
                this.ideogram = new Ideogram({
                    organism: this.props.organism,
                    assembly: "GRCh37",
                    container: '#ideo-container',
                    chrHeight: 1500,
                    chrWidth: 35,
                    chromosome: this.state.openChromosome,
                    orientation: "horizontal",
                    annotationsLayout: 'histogram',
                    barWidth: 3,
                    annotations: this.props.markerData,
                    brush: "chr" + this.state.openChromosome + ":17487076-41901071",
                    onBrushMove: () => this.writeSelectedRange(this),
                    onLoad: () => this.writeSelectedRange(this),
                    onDidRotate: this.onDidRotate
                });
            } else {
                this.ideogram = new Ideogram({
                    organism: this.props.organism,
                    assembly: "GRCh37",
                    container: '#ideo-container',
                    chrHeight: 600,
                    chrWidth: 15,
                    annotationsLayout: 'histogram',
                    barWidth: 3,
                    annotations: this.props.markerData,
                    onDidRotate: this.onDidRotate,
                    onBrushMove: () => this.writeSelectedRange(this),
                });
            }
            return this.ideogram;
        }
    }

    writeSelectedRange = (self) => {
        let r = self.ideogram.selectedRegion;
        if (r && self.state.openChromosome) {
            self.brushStart = r.from;
            self.brushStop = r.to;
            self.brushExtent = r.extent;
            self.clearBrushMarkers();
            self.getBrushMarkers(self);
        }
    }

    clearBrushMarkers = () => {
        let markerContainer = document.getElementById("brush-marker-container");
        markerContainer.innerHTML = "";
    }

    getBrushMarkers = (self) => {
        let markerContainer = document.getElementById("brush-marker-container");
        self.props.markerData.forEach((marker) => {
            if (marker.chr === self.state.openChromosome && marker.start >= self.brushStart && marker.stop <= self.brushStop) {
                if (marker.pval >= self.state.brushMarkerPval)
                    markerContainer.innerHTML += "<div class='brush-marker'>" + marker.name + "</div>";
            }
        });
    }

    onDidRotate = (e) => {
        if (e.oldWidth < e.width) { // Expanded
            this.setState({openChromosome: e.name});
            $("#brush-menu-container").show();
        } else {
            this.setState({openChromosome: null});
            $("#brush-menu-container").hide();
        }
    }

    expandIdeogram = (self) => {
        self.clearBrushMarkers();
        self.setState({openChromosome: null});
        $("#brush-menu-container").hide();
    }

    render() {
        this.getIdeogram();
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
                <div id="ideo-container"/>

                <div id="brush-menu-container">
                    <br/>
                        <FormControl className={classes.formControl}>
                            <InputLabel shrink>Mouse P-value</InputLabel>
                            <Select value={this.state.brushMarkerPval} className={classes.selectEmpty} id="select"
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
                    <hr/>
                    <div id="brush-marker-container">
                    </div>
                </div>

            </div>
        );
    }
}

export default withStyles(useStyles)(AppIdeogram);