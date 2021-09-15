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
import Typography from "@material-ui/core/Typography";
import Genome from "../Genome/Genome";
import {CSSTransition, SwitchTransition} from "react-transition-group";

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
            tableOrder: "",
            genotypeTermID: "",
            genotypeOntology: ""
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

    viewBtnClicked = (mouseTerm, humanTerm, humanOnt) => {
        this.setState({mouseTerm: mouseTerm, humanTerm: humanTerm, humanOntology: humanOnt, searchOpen: false});
    }

    genotypeBtnClicked = (term, ontology) => {
        this.setState({genotypeTermID: term, genotypeOntology: ontology});
    }

    onBreakdownFinish = (e) => {
        this.setState({loading: false});
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
        let ordering = this.state.selectedSpecies === "Human" ? "GWAS Studies" : "Mouse Knockouts";
        this.setState({loading: true, displayError: false, tableData: null, tableOrder: ordering});
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
                            this.setState({
                                tableData: "No results found for " + search_input + ".",
                                loading: false,
                                searchOpen: true
                            });
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

    openOntologyTerm = (e) => {
        let term = e.target.innerText;
        if (term !== "-")
            if (term.startsWith("HP:"))
                window.open("https://hpo.jax.org/app/browse/term/" + term, "_blank").focus();
            else if (term.startsWith("MP:"))
                window.open("http://www.informatics.jax.org/vocab/mp_ontology/" + term, "_blank").focus();
            else if (term.startsWith("D"))
                window.open("https://meshb.nlm.nih.gov/record/ui?ui=" + term, "_blank").focus();
    }

    displayTable = (tableData) => {
        let orderBy = this.state.tableOrder;
        if (tableData === "No results found.")
            return
        else
            return <ResultTable order={"desc"} orderBy={orderBy}
                                hoverDataMap={{"Human Phenotype": "Human Synonyms", "MP Label": "Mouse Synonyms"}}
                                genotypeBtnClicked={this.genotypeBtnClicked} viewBtnClicked={this.viewBtnClicked}
                                hiddenHeaders={["Human Synonyms", "Mouse Synonyms", "Procedure Key", "Parameter Key"]}
                                isSearchResult={true}
                                cellClickHandlers={{"ID": this.openOntologyTerm, "MP ID": this.openOntologyTerm}}
                                tableData={tableData}/>

    }

    genotypeHandler = () => {
        this.setState({genotypeTermID: this.state.humanTerm, genotypeOntology: this.state.humanOntology});
    }

    render() {
        const {tableData, liveLoading, loading, searchOpen, liveSearchResults} = this.state;
        const {classes} = this.props;
        return (
            <SwitchTransition>
                <CSSTransition
                    key={this.state.genotypeTermID}
                    addEndListener={(node, done) => node.addEventListener("transitionend", done, false)}
                    classNames='fade'
                >
                    {
                        !this.state.genotypeTermID ? <div className="PhenotypeSearch">
                                <LoadingSpinner loading={loading}/>
                                <div className="searchResultsContainer">
                                    {/* Orthology Selection */}
                                    <div className="orthology-menu">
                                        <Typography variant="h6">Comparative data on human-mouse orthologues.</Typography>
                                        <br/>
                                        <Autocomplete
                                            freeSolo
                                            className={classes.autoComplete}
                                            onInputChange={this.retrieveLiveSearch}
                                            id="phenotypeSearchInput"
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
                                                                {liveLoading ?
                                                                    <CircularProgress color="inherit" size={20}/> : null}
                                                                {params.InputProps.endAdornment}
                                                            </React.Fragment>
                                                        ),
                                                    }}
                                                    // onKeyDown={e => {
                                                    //     if (e.keyCode === 13) {
                                                    //         this.searchClick();
                                                    //     }
                                                    // }}
                                                />
                                            )}
                                            options={liveSearchResults}
                                            getOptionLabel={(option) => option.FSN ? option.FSN : this.state.searchInput}
                                            selectOnFocus={false}
                                            renderOption={(option) => option.FSN + " (" + option.type + ")"}/>
                                        {this.state.displayError ? <span style={{color: "red"}}>Search term too broad, please use more characters.</span> : null}
                                        <RadioGroup row className={classes.radio} name="speciesRadio"
                                                    value={this.state.selectedSpecies}
                                                    onChange={this.speciesRadioChanged}>
                                            <FormControlLabel value="Human" label="Human" control={<Radio/>}
                                                              id="human-radio"/>
                                            <FormControlLabel value="Mouse" label="Mouse" control={<Radio/>}
                                                              id="mouse-radio"/>
                                        </RadioGroup>
                                        <FormControl className={classes.formControl} onChange={this.humanPValChanged}>
                                            <InputLabel shrink>Human P-value</InputLabel>
                                            <Select value={this.state.humanPval} className={classes.selectEmpty}
                                                    id="human_pval_select"
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
                                                <MenuItem value={10}>10</MenuItem>
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
                                {/*Phenotype selection results drill down*/}
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
                                                breakdownData={this.state.breakdownData}
                                                onBreakdownFinish={this.onBreakdownFinish}
                                                setLoading={this.props.setLoading}
                                                genotypeHandler={this.genotypeHandler}/>
                                        </div>
                                    </DialogContent>
                                    <DialogActions>
                                        <Button onClick={() => this.setState({searchOpen: true})} color="primary">
                                            Close
                                        </Button>
                                    </DialogActions>
                                </Dialog>
                            </div> :
                            <div>
                                <Button size="large" color="primary" variant="contained" onClick={() => this.setState({
                                    genotypeTermID: null,
                                    genotypeOntology: null
                                })}>Back</Button><br />
                                <Genome genotypeTermID={this.state.genotypeTermID}
                                        genotypeOntology={this.state.genotypeOntology}
                                        setLoading={this.props.setLoading}/>
                            </div>
                    }

                </CSSTransition>
            </SwitchTransition>
        );
    }
}

export default withStyles(useStyles)(PhenotypeSearch);