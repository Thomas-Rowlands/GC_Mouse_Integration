import React from 'react';
import './PhenotypeSearch.css';
import $ from 'jquery';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Radio,
    RadioGroup,
    Select,
    TextField,
    withStyles
} from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import CircularProgress from '@material-ui/core/CircularProgress'
import ResultTable from "../UtilityComponents/ResultTable";
import PhenotypeResultBreakdown from "./Components/PhenotypeResultBreakdown";
import axios from "axios";
import LoadingSpinner from "../UtilityComponents/LoadingSpinner/LoadingSpinner";
import api_server from "../UtilityComponents/ConfigData";
import Grow from '@material-ui/core/Grow';

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


class PhenotypeSearch extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            selectedSpecies: "Mouse",
            loading: false,
            tableData: null,
            liveSearchResults: [],
            mouseTerm: null,
            humanTerm: null,
            humanOntology: null,
            searchOpen: true,
            breakdownData: null,
            humanPval: 0,
            mousePval: 0,
            searchInput: "",
            configData: api_server,
            displayError: false,
        };
        this.page_num = 1;
        this.liveCancelToken = null;
    }

    componentDidMount() {

    }

    getPreviousResults = () => {
        if (this.page_num > 1) {
            this.page_num -= 1;
            this.search();
        }
    }

    humanPValChanged = (e) => {
        this.setState({humanPval: e.target.value});
    }

    mousePValChanged = (e) => {
        this.setState({mousePval: e.target.value});
    }

    getNextResults = () => {
        this.page_num += 1;
        this.search();
    }

    searchRowClicked = (row) => {
        let mouseTerm = $(row.target).attr("data-mouse-term");
        let humanTerm = $(row.target).attr("data-human-term");
        let humanOnt = $(row.target).attr("data-human-ont");
        this.setState({mouseTerm: mouseTerm, humanTerm: humanTerm, humanOntology: humanOnt, searchOpen: false});
    }

    retrieveLiveSearch = (e, x) => {
        let input = x;
        if (this.liveCancelToken)
            this.liveCancelToken.cancel();
        this.setState({searchInput: input});
        if (input.length < 1) {
            $("#live-search").hide();
            this.setState({liveLoading: false, liveSearchResults: [], inputErrorText: "Input cannot be empty."});
            return;
        }
        this.liveCancelToken = axios.CancelToken.source();
        this.setState({liveLoading: true});
        let ontology = this.state.selectedSpecies === "Human" ? "HPO" : "MP"
        let url_string = this.state.configData.api_server + "livesearch.php?entry=" + encodeURIComponent(input) + "&ontology=" + ontology;
        if (input.length > 0) {
            axios.get(url_string, {cancelToken: this.liveCancelToken.token})
                .then((response) => {
                    if (response.status === 200) {
                        if (response.data.length === 0) {
                            this.setState({liveSearchResults: [], liveLoading: false});
                        } else {
                            this.setState({liveSearchResults: response.data, liveLoading: false});
                        }
                    }
                })
                .catch((error) => {
                    if (!axios.isCancel(error)) {
                        console.log("An error occurred retrieving live search results.");
                    }
                });
        }
    }

    search = () => {
        let search_input = this.state.searchInput;
        if (search_input.length < 3) {
            this.setState({displayError: true});
            return;
        }
        this.setState({loading: true, displayError: false});
        let human_pval = this.state.humanPval;
        let mouse_pval = this.state.mousePval;
        let url_string = this.state.configData.api_server + "/controller.php?type=study&search=" + encodeURIComponent(search_input) + "&page=" + this.page_num + "&human_pval=" + human_pval + "&mouse_pval=" + mouse_pval + "&species=" + this.state.selectedSpecies;
        axios.get(url_string)
            .then((response) => {
                if (response.status === 200) {
                    if (response.data) {
                        var result_total = response.data[1];
                        if (result_total > 0) {
                            this.setState({tableData: response.data[0], loading: false, searchOpen: true});
                        } else {
                            this.setState({tableData: "No results found.", loading: false, searchOpen: true});
                        }
                    } else {
                        this.setState({loading: false, searchOpen: true, tableData: null});
                    }
                }
            })
            .catch((error) => {
                this.setState({loading: false, searchOpen: true, tableData: null});
                console.log("An error occurred searching for phenotype results.");
            });
    }

    searchClick = () => {
        this.page_num = 1;
        this.search();
    }

    speciesRadioChanged = (e) => {
        this.setState({selectedSpecies: e.target.value});
    }

    displayTable = (tableData) => {
        if (tableData === "No results found.")
            return <p className="center"><br/>{tableData}</p>
        else
            return <ResultTable isSearchResult={true} tableData={tableData} onRowClick={this.searchRowClicked}/>

    }

    render() {
        const {tableData, liveLoading, loading, searchOpen, liveSearchResults} = this.state;
        const {classes} = this.props;
        return (<div className="PhenotypeSearch">
                <LoadingSpinner loading={loading}/>
                <div className="searchResultsContainer">
                    {/* Orthology Selection */}
                    <div className="orthology-menu">
                        <h4>Comparative data on human-mouse orthologues.</h4>
                        <Autocomplete
                            freeSolo
                            className={classes.autoComplete}
                            onInputChange={this.retrieveLiveSearch}
                            defaultValue={this.state.searchInput}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Phenotype search"
                                    variant="outlined"
                                    required
                                    helperText={this.state.inputErrorText}
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <React.Fragment>
                                                {liveLoading ? <CircularProgress color="inherit" size={20}/> : null}
                                                {params.InputProps.endAdornment}
                                            </React.Fragment>
                                        ),
                                    }}
                                    onKeyDown={e => {
                                        if (e.keyCode === 13) {
                                            this.searchClick();
                                        }
                                    }}
                                />
                            )}
                            options={liveSearchResults}
                            getOptionLabel={(option) => option.FSN ? option.FSN : ""}
                            renderOption={(option) => option.FSN + " (" + option.type + ")"}/>
                        {this.state.displayError ? <span style={{color: "red"}}>Search term too broad, please use more characters.</span> : null}
                        <RadioGroup row className={classes.radio} name="speciesRadio" value={this.state.selectedSpecies}
                                    onChange={this.speciesRadioChanged}>
                            <FormControlLabel value="Human" label="Human" control={<Radio/>} id="human-radio"/>
                            <FormControlLabel value="Mouse" label="Mouse" control={<Radio/>} id="mouse-radio"/>
                        </RadioGroup>
                        <FormControl className={classes.formControl} onChange={this.humanPValChanged}>
                            <InputLabel shrink>Human P-value</InputLabel>
                            <Select value={this.state.humanPval} className={classes.selectEmpty} id="human_pval_select"
                                    onChange={this.humanPValChanged}>
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
                            <InputLabel shrink>Mouse P-value</InputLabel>
                            <Select value={this.state.mousePval} className={classes.selectEmpty} id="select"
                                    onChange={this.mousePValChanged}>
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
                                <MenuItem value={1}>10</MenuItem>
                            </Select>
                        </FormControl>
                        <div className="input-group-inline">
                            <Button size="large" color="primary" variant="contained" id="search_btn"
                                    onClick={this.searchClick}>Search</Button>
                        </div>
                    </div>
                    <div className="table-container">
                        {tableData ? this.displayTable(tableData) : null}
                    </div>
                </div>
                {/*Phenotype selection results drill down*/
                }
                <Dialog
                    fullWidth={true}
                    maxWidth="lg"
                    open={!searchOpen}
                    aria-labelledby="max-width-dialog-title"
                    TransitionComponent={Grow}
                >
                    <DialogContent>
                        <div className="table-container">
                            <PhenotypeResultBreakdown
                                mousePhenotype={this.state.mouseTerm}
                                humanPhenotype={this.state.humanTerm}
                                humanOntology={this.state.humanOntology}
                                breakdownData={this.state.breakdownData}/>
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => this.setState({searchOpen: true})} color="primary">
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        )
            ;
    }
}

export default withStyles(useStyles)(PhenotypeSearch);