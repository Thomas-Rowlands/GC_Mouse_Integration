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

const mouse_track_icon = "<g transform='translate(0, 28) scale(0.003, 0.003) rotate(90)'\n" +
    "fill='#000000' stroke='none'>\n" +
    "<path d='M1442 4316 c-66 -71 -67 -77 -22 -121 l39 -38 29 24 c16 13 43 32 60\n" +
    "41 l31 17 -15 37 c-24 57 -45 84 -64 84 -10 0 -36 -20 -58 -44z'/>\n" +
    "<path d='M945 4273 c-16 -2 -88 -16 -160 -31 -117 -23 -153 -26 -350 -27 -121\n" +
    "0 -227 -4 -237 -8 -43 -21 -48 -115 -9 -202 36 -81 136 -170 336 -300 54 -35\n" +
    "130 -98 191 -159 125 -125 165 -199 190 -351 18 -108 59 -235 107 -330 72\n" +
    "-144 206 -307 331 -403 67 -52 90 -93 111 -208 39 -202 -6 -365 -120 -442 -28\n" +
    "-19 -50 -39 -50 -45 0 -15 79 -25 204 -26 l93 -1 -6 28 c-23 94 -21 107 32\n" +
    "214 28 57 70 167 93 247 25 82 56 165 74 195 18 28 57 91 88 139 95 149 127\n" +
    "264 107 374 -14 74 -5 93 42 93 24 0 32 -6 43 -34 50 -119 8 -309 -106 -487\n" +
    "-16 -25 -29 -48 -29 -51 0 -4 31 -29 69 -57 37 -28 117 -94 177 -147 135 -118\n" +
    "192 -158 269 -184 78 -27 227 -45 298 -36 l58 8 -44 48 c-212 236 -186 711 51\n" +
    "921 133 119 363 152 315 46 -8 -17 -27 -26 -83 -39 -126 -30 -209 -100 -269\n" +
    "-229 -150 -321 -7 -704 291 -779 109 -28 140 -131 57 -192 -21 -16 -55 -21\n" +
    "-225 -29 -109 -6 -217 -15 -239 -21 -27 -7 -56 -26 -88 -60 -27 -27 -46 -52\n" +
    "-43 -55 9 -9 730 27 752 38 12 6 34 36 50 66 44 87 114 157 202 200 l76 38\n" +
    "131 0 c96 -1 171 -8 289 -29 542 -94 814 -275 833 -553 18 -254 -146 -396\n" +
    "-527 -458 -52 -8 -196 -19 -320 -25 -300 -13 -387 -18 -565 -36 -251 -25 -566\n" +
    "-79 -685 -119 l-45 -14 40 4 c46 5 663 57 955 80 107 8 286 19 398 25 224 12\n" +
    "389 36 499 74 269 92 376 241 360 501 -5 76 -11 100 -43 163 -64 131 -210 254\n" +
    "-398 335 -84 36 -158 58 -356 102 -149 34 -260 106 -313 204 -21 38 -35 89\n" +
    "-53 195 -58 346 -160 620 -317 851 -75 110 -265 303 -363 367 -213 141 -452\n" +
    "218 -676 218 -136 0 -214 -22 -358 -99 -225 -122 -365 -164 -469 -141 -75 17\n" +
    "-121 62 -121 117 0 53 29 78 105 93 93 18 150 38 194 71 35 25 41 35 41 65 0\n" +
    "23 -10 51 -30 79 -56 81 -131 105 -208 66 -47 -24 -139 -120 -186 -194 -30\n" +
    "-47 -42 -57 -64 -57 -66 0 -67 41 -3 135 l49 73 -46 45 c-60 57 -115 91 -189\n" +
    "115 -61 21 -157 32 -208 25z'/>\n" +
    "<path d='M1130 2280 c-86 -171 -122 -220 -201 -271 -79 -51 -67 -63 67 -67\n" +
    "l111 -3 12 47 c18 70 35 99 133 217 63 76 87 113 83 126 -3 10 -32 39 -65 65\n" +
    "l-60 46 -80 -160z'/>\n" +
    "</g>";

const human_track_icon = "<g transform='translate(0, 13) scale(0.003, 0.003) rotate(90)'\n" +
    "fill='#000000' stroke='none'>\n" +
    "<path d='M2460 5109 c-158 -31 -293 -169 -327 -335 -63 -310 220 -579 527\n" +
    "-499 326 85 430 493 183 726 -102 97 -241 136 -383 108z'/>\n" +
    "<path d='M2465 4063 c-160 -21 -290 -56 -389 -106 -378 -189 -609 -693 -594\n" +
    "-1299 4 -167 6 -179 32 -230 43 -86 112 -127 214 -128 63 0 107 17 144 56 46\n" +
    "49 49 73 42 258 -10 257 16 460 83 636 l28 75 3 -675 c2 -371 -3 -1012 -10\n" +
    "-1425 -7 -412 -13 -825 -13 -916 0 -164 0 -166 27 -207 76 -115 257 -135 371\n" +
    "-41 63 52 79 96 88 247 10 158 29 1075 29 1390 l0 222 35 0 35 0 0 -177 c0\n" +
    "-287 20 -1265 29 -1423 6 -118 12 -153 29 -187 82 -159 333 -177 430 -31 27\n" +
    "41 27 43 27 212 0 94 -6 504 -12 911 -7 407 -15 1055 -18 1440 l-6 700 22 -40\n" +
    "c32 -58 66 -165 91 -284 19 -92 22 -141 23 -366 1 -171 5 -267 12 -280 59\n" +
    "-105 226 -127 332 -44 17 13 43 49 58 79 l28 55 0 225 c0 189 -4 244 -22 345\n" +
    "-93 501 -341 843 -696 956 -116 37 -356 65 -452 52z'/>\n" +
    "</g>";


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
                annotationsLayout: "tracks",
                onClickAnnot: this.props.onAnnotationClick,
                onLoad: () => this.filterAnnots(0, 0),
                annotationTracks: [
                    {id: 'markerTrack', displayName: 'Human', shape: this.getShape()},
                    {id: 'knockoutTrack', displayName: 'Mouse', shape: this.getShape()}
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
        this.draw_track_labels()
        this.ideogram.drawAnnots(results);
    }

    draw_track_labels = () => {
        let chromosome_elements = document.getElementsByClassName("chromosome-set");
        chromosome_elements.forEach((elem) => {
            elem.innerHTML += mouse_track_icon;
            elem.innerHTML += human_track_icon;
        });
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

                </div>


                <div className="ideo-container"/>
            </div>
        );
    }
}

export default withStyles(useStyles)(AppIdeogram);