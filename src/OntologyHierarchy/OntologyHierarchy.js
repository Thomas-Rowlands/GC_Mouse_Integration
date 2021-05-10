import React from 'react';
import $ from 'jquery';
import axios from "axios";
import {Button, Grid, InputLabel, MenuItem, Paper, Select, TextField, withStyles} from '@material-ui/core';
import LoadingSpinner from "../UtilityComponents/LoadingSpinner/LoadingSpinner";
import './OntologyHierarchy.css';
import Autocomplete from "@material-ui/lab/Autocomplete";
import CircularProgress from "@material-ui/core/CircularProgress";
import ErrorBoundary from "../UtilityComponents/ErrorBoundary";
import OntologyTree from "./Components/OntologyTree/OntologyTree";
import _ from "lodash";
import PhenotypeResultBreakdown from "../PhenotypeSearch/Components/PhenotypeResultBreakdown";
import api_server from "../UtilityComponents/ConfigData";

const useStyles = theme => ({
    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
    },
    selectEmpty: {
        marginTop: theme.spacing(2),
    },
    autoComplete: {
        width: "75%",
        marginLeft: "auto",
        marginRight: "auto",
        paddingBottom: 5,
    },
    paper: {
        padding: theme.spacing(1),
        textAlign: 'center',
        color: theme.palette.text.secondary,
    },
});

class OntologyHierarchy extends React.Component {

    function

    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            treeData: null,
            expandedMouseNodes: [''],
            expandedHumanNodes: [''],
            selectedMouseNodes: [''],
            selectedHumanNodes: [''],
            selectedSpecies: "Mouse",
            isMappingPresent: false,
            conErrorStatus: false,
            configData: api_server,
            searchInput: "",
            humanLiveSearchResults: [],
            humanOntology: "HPO",
        };
        this.tempExpandedmouseIds = [];
        this.tempExpandedhumanIds = [];
        this.liveCancelToken = null;
        this.mouseLiveSearchResults = [];
        this.humanLiveSearchResults = [];
        this.mouseLiveLoading = false;
        this.humanLiveLoading = false;
        this.searchInput = "";
    }

    componentDidMount() {
        this.getRootTrees();
    }

    retrieveLiveSearch = (e, x) => {
        let input = x;
        let ontology = e.target.id === "mouseSearchInput" ? "MP" : this.state.humanOntology;
        if (this.liveCancelToken)
            this.liveCancelToken.cancel();
        if (input.length < 1) {
            $("#live-search").hide();
            if (ontology === "MP") {
                this.mouseLiveLoading = false;
                this.mouseLiveSearchResults = [];
            } else {
                this.humanLiveLoading = false;
                this.humanLiveSearchResults = [];
            }
            return;
        }
        if (ontology === "MP")
            this.mouseLiveLoading = true;
        else
            this.humanLiveLoading = true;
        this.searchInput = input;
        this.liveCancelToken = axios.CancelToken.source();
        let url_string = this.state.configData.api_server + "livesearch.php?entry=" + encodeURIComponent(input) + "&ontology=" + ontology;

        if (input.length > 0) {
            axios.get(url_string, {cancelToken: this.liveCancelToken.token})
                .then((response) => {
                    if (response.status === 200) {
                        if (response.data.length === 0) {
                            if (ontology === "MP") {
                                this.mouseLiveSearchResults = [];
                                this.mouseLiveLoading = false;
                            } else {
                                this.humanLiveSearchResults = [];
                                this.humanLiveLoading = false;
                            }
                        } else {
                            if (ontology === "MP") {
                                this.mouseLiveSearchResults = response.data;
                                this.mouseLiveLoading = false;
                            } else {
                                this.humanLiveSearchResults = response.data;
                                this.humanLiveLoading = false;
                                this.setState({humanLiveSearchResults: response.data});
                            }
                        }
                    }
                })
                .catch((error) => {
                    if (!axios.isCancel(error)) {
                        console.log("An error occurred retrieving live search results.");
                    } else {
                        if (ontology === "MP") {
                            this.mouseLiveSearchResults = [];
                            this.mouseLiveLoading = false;
                        } else {
                            this.humanLiveSearchResults = [];
                            this.humanLiveLoading = false;
                        }
                    }


                });
        }
    }

    appendSearchResult = (objValue, srcValue) => {
        if (_.isArray(objValue)) {
            for (var i = 0; i < objValue.length; i++) {
                if (objValue[i].FSN === srcValue[0].FSN) {
                    objValue[i] = _.merge(objValue[i], srcValue[0]);
                    return objValue;
                }
            }
        }
    }

    isNodeDuplicate = (source, newItem) => {
        for (var i = 0; i < source.length; i++) {
            if (source[i].id === newItem.id) {
                return true;
            }
        }
        return false;
    }

    findPath = (a, obj) => {
        for (var key in obj) {                                         // for each key in the object obj
            if (obj.hasOwnProperty(key)) {                             // if it's an owned key
                if (a === obj[key]) return key;                        // if the item beign searched is at this key then return this key as the path
                else if (obj[key] && typeof obj[key] === "object") {   // otherwise if the item at this key is also an object
                    var path = this.findPath(a, obj[key]);                 // search for the item a in that object
                    if (path) return key + "." + path;                 // if found then the path is this key followed by the result of the search
                }
            }
        }
    }

    getAllPaths = (obj, key, prev = '') => {
        const result = [];

        for (let k in obj) {
            let path = prev + (prev ? '.' : '') + k;

            if (obj[k] === key) {
                result.push(path);
            } else if (typeof obj[k] == 'object') {
                result.push(...this.getAllPaths(obj[k], key, path));
            }
        }

        return result
    }

    pathToIdArray = (path, tree) => {
        var result = [];
        for (var i = 2; i < path.length; i += 2) {
            result.push(tree.children[path[i]].id);
            tree = tree.children[path[i]];
        }
        return result;
    }

    /**
     * Simple object check.
     * @param item
     * @returns {boolean}
     */
    isObject = (item) => {
        return (item && typeof item === 'object' && !Array.isArray(item));
    }

    /**
     * Deep merge two objects.
     * @param target
     * @param ...sources
     */
    mergeDeep = (target, ...sources) => {
        if (!sources.length) return target;
        const source = sources.shift();

        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                if (this.isObject(source[key])) {
                    if (!target[key]) Object.assign(target, {[key]: {}});
                    this.mergeDeep(target[key], source[key]);
                } else {
                    Object.assign(target, {[key]: source[key]});
                }
            }
        }
        return this.mergeDeep(target, ...sources);
    }

    objectToPaths = (data, target) => {
        var result = [];
        var matched_paths = [];
        doIt(data, "");
        return matched_paths;

        function doIt(data, s) {
            if (data && typeof data === "object") {
                if (Array.isArray(data)) {
                    for (var i = 0; i < data.length; i++) {
                        if (data[i] === target) {
                            matched_paths.push(s + "." + i);
                        }
                        doIt(data[i], s + "." + i);
                    }
                } else {
                    for (var p in data) {
                        if (data[p] === target) {
                            matched_paths.push(s + "." + p);
                        }
                        doIt(data[p], s + "." + p);
                    }
                }
            } else {
                result.push(s);
            }
        }
    }

    search = (searchInput, ontology) => {
        this.setState({loading: true, isMappingPresent: false});
        if (searchInput === undefined || searchInput === "") {
            this.getRootTrees();
            return;
        }
        let humanOnt = this.state.humanOntology;
        let mouseOnt = "MP";
        let searchOnt = ontology;
        let url_string = this.state.configData.api_server + "controller.php?type=ontology&search&term=" + searchInput + "&humanOntology=" + humanOnt + "&mouseOntology=" + mouseOnt + "&searchOntology=" + searchOnt;
        axios.get(url_string)
            .then((response) => {
                if (response.status === 200) {
                    if (response.data) {
                        let tree = this.state.treeData;
                        let expandedMouseNodes = [];
                        let expandedHumanNodes = [];
                        tree["humanID"] = response.data.humanID;
                        tree["mouseID"] = response.data.mouseID;
                        tree["isExactMatch"] = response.data.isExactMatch;
                        tree["mouseTree"] = response.data.mouseTree;
                        tree["humanTree"] = response.data.humanTree;
                        let mousePaths = this.objectToPaths(tree["mouseTree"], tree["mouseID"]);
                        if (mousePaths.length > 1) {
                            mousePaths.forEach(mousePath => this.pathToIdArray(mousePath.split("."), tree["mouseTree"]).forEach(id => expandedMouseNodes.push(id)));
                        } else {
                            expandedMouseNodes = this.pathToIdArray(mousePaths[0].split("."), tree["mouseTree"]);
                        }
                        expandedMouseNodes.unshift("MP:0000001");
                        let tempFilteredNodes = [];
                        expandedMouseNodes.forEach(node => node !== tree["mouseID"] ? tempFilteredNodes.push(node) : null);
                        expandedMouseNodes = tempFilteredNodes;

                        let humanPaths = this.objectToPaths(tree["humanTree"], tree["humanID"]);
                        if (humanPaths.length > 1) {
                            humanPaths.forEach(humanPath => this.pathToIdArray(humanPath.split("."), tree["humanTree"]).forEach(id => expandedHumanNodes.push(id)));
                        } else {
                            expandedHumanNodes = this.pathToIdArray(humanPaths[0].split("."), tree["humanTree"]);
                        }
                        if (humanOnt === "MESH")
                            expandedHumanNodes.unshift("mesh");
                        else
                            expandedHumanNodes.unshift("HP:0000001");
                        tempFilteredNodes = [];
                        expandedHumanNodes.forEach(node => node !== tree["humanID"] ? tempFilteredNodes.push(node) : null);
                        expandedHumanNodes = tempFilteredNodes;

                        this.setState({
                            treeData: tree,
                            loading: false,
                            isMappingPresent: true,
                            expandedMouseNodes: expandedMouseNodes,
                            selectedMouseNodes: tree["mouseID"],
                            expandedHumanNodes: expandedHumanNodes,
                            selectedHumanNodes: tree["humanID"],
                            mappedMousePhenotype: response.data.mouseID,
                            mappedHumanPhenotype: response.data.humanID,
                            humanSearchFailed: false,
                            mouseSearchFailed: false
                        }, () => this.scrollTrees());
                    } else {
                        this.setState({
                            loading: false,
                            isMappingPresent: false,
                            humanSearchFailed: searchOnt !== "MP",
                            mouseSearchFailed: searchOnt === "MP"
                        });
                    }
                }
            })
            .catch((error) => {
                this.setState({loading: false, searchOpen: true});
                console.log("An error occurred searching for ontology mappings.");
            });
    }

    updateTree = (id, children) => obj => {
        if (obj.id === id) {
            obj.children = children;
            return true;
        } else if (!_.isEmpty(obj.children))
            return obj.children.some(this.updateTree(id, children));
    }

    getRootTrees = (ontology = null) => {
        this.setState({loading: true});
        let ont = ontology ? ontology : "HPO";
        let url_string = this.state.configData.api_server + "controller.php?type=ontology&getRoots&ontology=" + ont;
        axios.get(url_string)
            .then((response) => {
                if (response.status === 200) {
                    if (response.data) {
                        let expandedMouseNodes = [];
                        let expandedHumanNodes = [];
                        expandedMouseNodes.push(response.data.mouseID);
                        expandedHumanNodes.push(response.data.humanID);
                        this.setState({
                            treeData: response.data,
                            loading: false,
                            expandedMouseNodes: expandedMouseNodes,
                            expandedHumanNodes: expandedHumanNodes,
                        });
                    } else {

                    }
                }
            })
            .catch((error) => {
                console.log("An error occurred retrieving root tree data.");
                this.setState({conErrorStatus: true, loading: false});
            });
    }

    getRootTree = (ontology, species) => {
        this.setState({loading: true});
        let mappingOnt = ontology === "MP" ? this.state.humanOntology : "MP";
        let url_string = this.state.configData.api_server + "controller.php?type=ontology&getRoot&ontology=" + ontology + "&mappingOnt=" + mappingOnt;
        axios.get(url_string)
            .then((response) => {
                if (response.status === 200) {
                    if (response.data) {
                        if (species === "human") {
                            let expandedHumanNodes = [];
                            expandedHumanNodes.push(response.data.ID);
                            let tree = this.state.treeData;
                            tree["humanTree"] = response.data.tree;
                            this.setState({treeData: tree, loading: false, expandedHumanNodes: expandedHumanNodes});
                        } else {
                            let expandedMouseNodes = [];
                            expandedMouseNodes.push(response.data.ID);
                            let tree = this.state.treeData;
                            tree["mouseTree"] = response.data.tree;
                            this.setState({treeData: tree, loading: false, expandedMouseNodes: expandedMouseNodes});
                        }
                    }
                }
            })
            .catch((error) => {
                console.log("An error occurred retrieving root tree data.");
                this.setState({conErrorStatus: true, loading: false});
            });
    }

    getTermChildren = (e, tree, ont) => {
        let url_string = this.state.configData.api_server + "/controller.php?type=ontology&childSearch&term=" + e + "&ontology=" + ont;
        axios.get(url_string)
            .then((response) => {
                if (response.status === 200) {
                    if (response.data) {
                        if (tree === "mouse") {
                            let tree = this.state.treeData;
                            [tree["mouseTree"]].forEach(this.updateTree(e, response.data));
                            this.setState({treeData: tree});
                        } else {
                            let tree = this.state.treeData;
                            [tree["humanTree"]].forEach(this.updateTree(e, response.data));
                            this.setState({treeData: tree});
                        }

                    }
                }
            })
            .catch((error) => {
                this.setState({loading: false, searchOpen: true, tableData: null});
                console.log("An error occurred searching for ontology mappings.");
            });
    }

    termSearchBtnClick = (term) => {
        this.setState({searchInput: term});
        this.search();
    }

    mouseSearchBtnClick = (e) => {
        let input = typeof e === "string" ? e : document.getElementById("mouseSearchInput").value;
        this.search(input, "MP");
    }

    humanSearchBtnClick = (e) => {
        let input = typeof e === "string" ? e : document.getElementById("humanSearchInput").value;
        this.search(input, this.state.humanOntology);
    }

    setexpandedMouseNodes = (nodes, ids) => {
        if (Array.isArray(ids[0]))
            ids = ids[0];
        ids.push(nodes.id);
        this.tempExpandedmouseIds = ids;
        return Array.isArray(nodes.isa) ? nodes.isa.map((node) => this.setexpandedMouseNodes(node, ids)) : ids;
    }
    setexpandedHumanNodes = (nodes, ids) => {
        if (Array.isArray(ids[0]))
            ids = ids[0];
        ids.push(nodes.id);
        this.tempExpandedhumanIds = ids;
        return Array.isArray(nodes.isa) ? nodes.isa.map((node) => this.setexpandedHumanNodes(node, ids)) : ids;
    }

    isLoadingRequired = (id, obj) => {
        if (obj.id === id && _.isEmpty(obj.children)) {
            return true;
        } else if (!_.isEmpty(obj.children)) {
            for (var i = 0; i < Object.keys(obj.children).length; i++) {
                if (this.isLoadingRequired(id, obj.children[i]))
                    return true;
            }
        }
    }

    handleMouseToggle = (event, nodeIds) => {
        let tree = this.state.treeData.mouseTree;
        var loadingRequired = this.isLoadingRequired(nodeIds[0], tree);
        if (loadingRequired) {
            this.getTermChildren(nodeIds[0], "mouse", "mp");
        }
        this.setState({expandedMouseNodes: nodeIds});
    }

    handleMouseSelect = (event, nodeIds) => {
        this.setState({selectedMouseNodes: nodeIds});
    }

    handleHumanToggle = (event, nodeIds) => {
        let tree = this.state.treeData.humanTree;
        var loadingRequired = this.isLoadingRequired(nodeIds[0], tree);
        if (loadingRequired) {
            this.getTermChildren(nodeIds[0], "human", this.state.humanOntology);
        }
        this.setState({expandedHumanNodes: nodeIds});
    }

    handleHumanSelect = (event, nodeIds) => {
        this.setState({selectedHumanNodes: nodeIds});
    }

    scrollTrees = () => {
        if (this.state.mappedMousePhenotype && this.state.isMappingPresent) {
            $('#humanTree').animate({
                scrollTop: $("#humanTree-" + this.state.mappedHumanPhenotype.replace(":", "-")).offset().top - ($("#humanTree").position().top + 90)
            }, 1000);
            $('#mouseTree').animate({
                scrollTop: $("#mouseTree-" + this.state.mappedMousePhenotype.replace(":", "-")).offset().top - ($("#mouseTree").position().top + 90)
            }, 1000);
            this.setState({mappedMousePhenotype: null, mappedHumanPhenotype: null});
        }

    }

    changeHumanOntology = (e) => {
        this.setState({
            humanOntology: e.target.value,
            selectedHumanNodes: [''],
            expandedHumanNodes: [''],
            selectedMouseNodes: [''],
            expandedMouseNodes: [''],
            isMappingPresent: false,
        });
        this.getRootTrees(e.target.value);
    }

    render() {
        const {classes} = this.props;
        const {
            loading,
            treeData,
            conErrorStatus,
            selectedMouseNodes,
            selectedHumanNodes,
            expandedMouseNodes,
            expandedHumanNodes,
            mappedMousePhenotype,
            mappedHumanPhenotype,
            humanLiveSearchResults,
        } = this.state;
        const mouseTree = treeData ? treeData.mouseTree : null;
        const humanTree = treeData ? treeData.humanTree : null;

        if (conErrorStatus)
            throw new Error("A connection error occurred retrieving ontology trees.");

        return <div>
            <ErrorBoundary>
                <Grid container spacing={2}>
                    <Grid item xs>
                        <Paper id="humanTreeWrapper" className={classes.paper}>
                            <InputLabel id="demo-simple-select-outlined-label">Human Ontology</InputLabel>
                            <Select
                                labelId="demo-simple-select-outlined-label"
                                id="demo-simple-select-outlined"
                                value={this.state.humanOntology}
                                onChange={this.changeHumanOntology}
                                label="Age"
                            >
                                <MenuItem value={"HPO"}>Human Phenotype Ontology</MenuItem>
                                <MenuItem value={"MESH"}>Medical Subject Headings</MenuItem>
                            </Select>
                            <br/><br/>
                            <Autocomplete
                                freeSolo
                                id="humanSearchInput"
                                className={classes.autoComplete}
                                onInputChange={this.retrieveLiveSearch}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Term search"
                                        variant="outlined"
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <React.Fragment>
                                                    {this.humanLiveLoading ?
                                                        <CircularProgress color="inherit" size={20}/> : null}
                                                    {params.InputProps.endAdornment}
                                                </React.Fragment>
                                            ),
                                        }}
                                    />
                                )}
                                options={this.state.humanLiveSearchResults.map((option) => option.FSN)}/>
                            <p>Search for terms with mappings to the MP ontology</p>
                            <Button size="large" color="primary" variant="contained" id="search_btn"
                                    onClick={this.humanSearchBtnClick}>Search</Button>
                            {this.state.humanSearchFailed ? <p style={{color: "red"}}>No match found.</p> : null}
                            {
                                !humanTree ? null :
                                    <OntologyTree treeID="humanTree" selectedPhenotypeLabel={mappedHumanPhenotype}
                                                  onBtnClick={this.humanSearchBtnClick} expanded={expandedHumanNodes}
                                                  selected={selectedHumanNodes} onSelect={this.handleHumanSelect}
                                                  onToggle={this.handleHumanToggle} treeData={humanTree}
                                                  sourceOntology={this.state.humanOntology} mappingOntology="MP"/>
                            }

                        </Paper>
                    </Grid>
                    <Grid item xs>
                        {
                            this.state.isMappingPresent ?
                                <PhenotypeResultBreakdown mousePhenotype={this.state.treeData.mouseID}
                                                          humanPhenotype={this.state.treeData.humanID}
                                                          humanOntology={this.state.humanOntology}/>
                                : null
                        }
                    </Grid>
                    <Grid item xs>
                        <Paper id="mouseTreeWrapper" className={classes.paper}>
                            <div className="ontologySearchWrapper">
                                <h3>Mammalian Phenotype</h3>
                                <Autocomplete
                                    freeSolo
                                    className={classes.autoComplete}
                                    id="mouseSearchInput"
                                    onInputChange={this.retrieveLiveSearch}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Term search"
                                            variant="outlined"
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <React.Fragment>
                                                        {this.mouseLiveLoading ?
                                                            <CircularProgress color="inherit" size={20}/> : null}
                                                        {params.InputProps.endAdornment}
                                                    </React.Fragment>
                                                ),
                                            }}
                                        />
                                    )}
                                    options={this.mouseLiveSearchResults.map((option) => option.FSN)}/>
                                <p>Search for MP terms which map to the selected human ontology.</p>
                                <Button size="large" color="primary" variant="contained" id="search_btn"
                                        onClick={this.mouseSearchBtnClick}>Search</Button>
                                {this.state.mouseSearchFailed ? <p style={{color: "red"}}>No match found.</p> : null}
                            </div>
                            <LoadingSpinner loading={loading}/>
                            {!mouseTree ? null :
                                <OntologyTree treeID="mouseTree" selectedPhenotypeLabel={mappedMousePhenotype}
                                              onBtnClick={this.mouseSearchBtnClick} expanded={expandedMouseNodes}
                                              selected={selectedMouseNodes} onSelect={this.handleMouseSelect}
                                              onToggle={this.handleMouseToggle} treeData={mouseTree}
                                              sourceOntology="MP" mappingOntology="HPO"/>}
                        </Paper>
                    </Grid>


                </Grid>
            </ErrorBoundary>

        </div>
    }
}

export default withStyles(useStyles)(OntologyHierarchy);