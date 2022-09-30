import React from 'react';
import './PhenotypeSearch.css';
import $ from 'jquery';
import {
    Button,
    Chip,
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
import InfoDialog from "../UtilityComponents/InfoDialog";

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
            genotypeOntology: "",
            termLimitReached: false,
            exactTermList: [],
            infoOpen: false
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

    genotypeBtnClicked = (mouseTerm, humanTerm, ontology) => {
        if (ontology !== "MP")
            this.setState({humanTermID: humanTerm, humanOntology: ontology, mouseTermID: mouseTerm});
        else
            this.setState({mouseTermID: mouseTerm, humanOntology: ontology});
    }

    onBreakdownFinish = (e) => {
        this.setState({loading: false});
    }

    retrieveLiveSearch = (e, x) => {
        let input = x;
        if (this.liveCancelToken)
            this.liveCancelToken.cancel();
        this.setState({searchInput: input, exactTerm: null});
        if (input.length < 1) {
            $("#live-search").hide();
            this.setState({liveLoading: false, liveSearchResults: [], inputErrorText: "Input cannot be empty."});
            return;
        }
        this.liveCancelToken = axios.CancelToken.source();
        this.setState({liveLoading: true});
        let ontology = this.state.selectedSpecies !== "Human" ? "MP" : "Human";
        let url_string = this.state.configData.api_server + "livesearch.php?entry=" + encodeURIComponent(input) + "&ontology=" + ontology;
        if (input.length > 0) {
            axios.get(url_string, {cancelToken: this.liveCancelToken.token})
                .then((response) => {
                    if (response.status === 200) {
                        this.setState({
                            liveSearchResults: response.data.length > 0 ? response.data : [],
                            liveLoading: false
                        });
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
        let search_input = null;
        if (this.state.isSearchExact) {
            search_input = this.state.exactTermList.map((term) => term.id).join();
        } else {
            search_input = this.state.searchInput;
        }

        if (search_input.length < 3 && this.state.exactTermList.length === 0) {
            this.setState({displayError: true});
            return;
        }
        let ordering = this.state.selectedSpecies === "Human" ? "GWAS Studies" : "Mouse Knockouts";
        this.setState({loading: true, displayError: false, tableData: null, tableOrder: ordering});
        let human_pval = this.state.humanPval;
        let mouse_pval = this.state.mousePval;
        let url_string = this.state.configData.api_server + "controller.php?type=study&search=" +
            encodeURIComponent(search_input) + "&page=" + this.page_num + "&human_pval=" + human_pval + "&mouse_pval="
            + mouse_pval + "&species=" + this.state.selectedSpecies + (this.state.isSearchExact ? "&exact" : "");
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
        if (this.state.isSearchExact) {
            this.setState({
                selectedSpecies: e.target.value,
                termLimitReached: false,
                exactTermList: [],
                isSearchExact: false
            });
        } else {
            this.setState({selectedSpecies: e.target.value});
        }

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
        this.setState({humanTermID: this.state.humanTerm, mouseTermID: this.state.mouseTerm});
    }

    getSearchInfoContent = () => {
        return `
        By inputting partial or exact ontology terms/synonyms, this search will return matching records along with their 
        associated GWAS studies and IMPC gene knockout experiments. 
        
        Each returned record can be further expanded for further
        information using the icon buttons on the right-hand side for a breakdown and karyotype/genotype view respectively.
        `;
    }

    formatOntology = (ont) => {
        if (!(typeof ont === 'string') && !(ont instanceof String))
            return ont;
        let lowerOnt = ont.toLowerCase();
        if (lowerOnt === "mesh")
            return "MeSH";
        if (lowerOnt === "hpo")
            return "HPO";
        if (lowerOnt === "mp")
            return "MP";
        return ont;
    }

    loadingHandler = (status) => {
        this.setState({dialogLoading: status});
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
                        !this.state.humanTermID && !this.state.mouseTermID ? <div className="PhenotypeSearch">
                                <LoadingSpinner loading={loading}/>
                                <div className="searchResultsContainer">
                                    {/* Orthology Selection */}
                                    <div className="orthology-menu">
                                        <Typography variant="h6">Comparative data on human-mouse orthologues. <InfoDialog
                                            title={"Phenotype Search"}
                                            contentText={this.getSearchInfoContent()}/></Typography>
                                        <br/>
                                        <Autocomplete
                                            freeSolo
                                            className={classes.autoComplete}
                                            multiple
                                            getOptionDisabled={(options) => this.state.termLimitReached}
                                            onInputChange={this.retrieveLiveSearch}
                                            id="phenotypeSearchInput"
                                            filterOptions={(options, state) => {
                                                if (options) {
                                                    for (let l = options.length - 1; l >= 0; l--) {
                                                        for (let i = 0; i < this.state.exactTermList.length; i++) {
                                                            if (options[l].id === this.state.exactTermList[i].id) {
                                                                options.splice(l, 1);
                                                                break;
                                                            }
                                                        }
                                                    }
                                                }
                                                return options;
                                            }}
                                            value={this.state.exactTermList ? this.state.exactTermList : []}
                                            renderTags={(value, getTagProps) => value.map((option, index) => (
                                                <Chip color="primary" label={option.FSN}
                                                      size="small" {...getTagProps({index})}/>
                                            ))}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Phenotype search"
                                                    variant="outlined"
                                                    required
                                                    // disabled={this.state.termLimitReached}
                                                    helperText={this.state.inputErrorText}
                                                    InputProps={{
                                                        ...params.InputProps,
                                                        onKeyDown: (e) => {
                                                          if (e.key === "Enter") {
                                                              this.search();
                                                              document.getElementById("phenotypeSearchInput").blur();
                                                              e.stopPropagation();
                                                          }
                                                        },
                                                        endAdornment: (
                                                            <React.Fragment>
                                                                {liveLoading ?
                                                                    <CircularProgress color="inherit" size={20}/> : null}
                                                                {params.InputProps.endAdornment}
                                                            </React.Fragment>
                                                        ),
                                                    }}
                                                />
                                            )}
                                            options={liveSearchResults}
                                            onChange={(e, newVal) => {
                                                if (e.code === "Enter") {
                                                    this.search();
                                                    return;
                                                }

                                                let termList = [];
                                                newVal.forEach(val => {
                                                    termList.push({
                                                        "FSN": (val.term ? val.term : val.FSN),
                                                        "id": (val.id ? val.id : val.termID)
                                                    });
                                                });
                                                this.setState({
                                                    "termLimitReached": newVal.length > 3,
                                                    "exactTermList": termList,
                                                    "isSearchExact": termList.length > 0
                                                });
                                            }
                                            }
                                            getOptionLabel={(option) => {
                                                if (option) {
                                                    if (option.term)
                                                        return option.term;
                                                    else
                                                        return option.FSN;
                                                }
                                                return this.state.searchInput;
                                            }}
                                            selectOnFocus={false}
                                            renderOption={(option) =>
                                                <div style={{width: "100%"}}>
                                                    <div style={{
                                                        display: "inline-block",
                                                        maxWidth: "30ch",
                                                        overflow: "hidden"
                                                    }}>
                                                        {option.term}
                                                    </div>
                                                    <div style={{
                                                        display: "inline-block",
                                                        float: "right",
                                                        fontWeight: "bold"
                                                    }}>
                                                        {this.formatOntology(option.ontology)}
                                                    </div>
                                                </div>}/>
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
                                <LoadingSpinner isRelative={true} loading={this.state.dialogLoading}/>
                                    <DialogContent>
                                        <div className="table-container">
                                            <PhenotypeResultBreakdown
                                                mousePhenotype={this.state.mouseTerm}
                                                humanPhenotype={this.state.humanTerm}
                                                humanOntology={this.state.humanOntology}
                                                breakdownData={this.state.breakdownData}
                                                setLoading={this.loadingHandler}
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
                                    humanTermID: null,
                                    mouseTermID: null
                                })}>Back</Button><br/>
                                <Genome humanTermID={this.state.humanTermID}
                                        humanOntology={this.state.humanOntology}
                                        mouseTermID={this.state.mouseTermID}
                                        setLoading={this.props.setLoading}/>
                            </div>
                    }

                </CSSTransition>
            </SwitchTransition>
        );
    }
}

export default withStyles(useStyles)(PhenotypeSearch);