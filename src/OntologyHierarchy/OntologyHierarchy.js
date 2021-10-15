import React from 'react';
import $ from 'jquery';
import axios from "axios";
import {Button, Grid, InputLabel, MenuItem, Paper, Select, TextField, withStyles} from '@material-ui/core';
import './OntologyHierarchy.css';
import Autocomplete from "@material-ui/lab/Autocomplete";
import CircularProgress from "@material-ui/core/CircularProgress";
import ErrorBoundary from "../UtilityComponents/ErrorBoundary";
import OntologyTree from "./Components/OntologyTree/OntologyTree";
import _ from "lodash";
import PhenotypeResultBreakdown from "../PhenotypeSearch/Components/PhenotypeResultBreakdown";
import api_server from "../UtilityComponents/ConfigData";
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

    constructor(props) {
        super(props);
        this.state = {
            treeData: null,
            expandedMouseNodes: [''],
            expandedHumanNodes: [''],
            selectedMouseNodes: [''],
            selectedHumanNodes: [''],
            selectedSpecies: "Mouse",
            isMappingPresent: false,
            isDataPresent: false,
            conErrorStatus: false,
            configData: api_server,
            searchInput: "",
            humanLiveSearchResults: [],
            mouseLiveSearchResults: [],
            humanOntology: "MESH",
            mouseSearchInput: "",
            humanSearchInput: "",
            genotypeTermID: null,
            genotypeOntology: null,
            breakdownType: 0, // 0 = both, 1 = human only, 2 = mouse only
        };
        this.tempExpandedmouseIds = [];
        this.tempExpandedhumanIds = [];
        this.liveCancelToken = null;
        this.mouseLiveLoading = false;
        this.humanLiveLoading = false;
        this.searchInput = "";
    }

    componentDidMount() {
        this.getRootTrees(this.state.humanOntology);
    }

    retrieveLiveSearch = (e, x) => {
        if (!e)
            return;
        let input = x;
        let ontology = e.target.id === "mouseSearchInput" ? "MP" : this.state.humanOntology;
        if (this.liveCancelToken)
            this.liveCancelToken.cancel();
        if (input.length < 1) {
            $("#live-search").hide();
            if (ontology === "MP") {
                this.mouseLiveLoading = false;
                this.setState({mouseLiveSearchResults: []});
            } else {
                this.humanLiveLoading = false;
                this.setState({humanLiveSearchResults: []});
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
                                this.mouseLiveLoading = false;
                                this.setState({mouseLiveSearchResults: []});
                            } else {
                                this.humanLiveLoading = false;
                                this.setState({humanLiveSearchResults: []});
                            }
                        } else {
                            if (ontology === "MP") {
                                this.mouseLiveLoading = false;
                                this.setState({mouseLiveSearchResults: response.data});
                            } else {
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

    convertNodesToNodeIDs = (nodeList, isHuman = false) => {
        let tempFilteredNodes = [];
        let tree = isHuman ? "humanTree" : "mouseTree";
        for (var i = 0; i < nodeList.length; i++) {
            var nodeID = tree;
            if (i !== 0)
                for (var l = 0; l <= i; l++) {
                    nodeID += "-" + nodeList[l];
                }
            else
                nodeID += "-" + nodeList[0];
            tempFilteredNodes.push(nodeID);
        }
        return tempFilteredNodes;
    }

    search = (searchInput, ontology) => {
        if (searchInput === undefined || searchInput === "") {
            this.getRootTrees(this.state.humanOntology);
            return;
        }
        this.props.setLoading(true);
        let humanOnt = this.state.humanOntology;
        let mouseOnt = "MP";
        let searchOnt = ontology;
        let url_string = this.state.configData.api_server + "controller.php?type=ontology&search&term=" + searchInput + "&humanOntology=" + humanOnt + "&mouseOntology=" + mouseOnt + "&searchOntology=" + searchOnt;
        axios.get(url_string)
            .then((response) => {
                if (response.status === 200) {
                    if (response.data) {
                        let tree = this.state.treeData;
                        let breakdownType = 0;

                        let expandedMouseNodes = this.state.expandedMouseNodes;
                        let selectedMouseNodes = this.state.selectedMouseNodes;
                        let mappedMousePhenotype = this.state.mappedMousePhenotype;

                        let expandedHumanNodes = this.state.expandedHumanNodes;
                        let selectedHumanNodes = this.state.selectedHumanNodes;
                        let mappedHumanPhenotype = this.state.mappedHumanPhenotype;


                        // populate human tree if result returned.
                        if (response.data.humanID) {
                            breakdownType = 1;
                            tree["humanID"] = response.data.humanID;
                            tree["humanTree"] = response.data.humanTree;
                            let humanPaths = this.objectToPaths(tree["humanTree"], tree["humanID"]);
                            if (humanPaths.length > 1) {
                                for (var i = 0; i < humanPaths.length; i++) {
                                    let humanPath = humanPaths[i];
                                    let tempPathIdArray = this.pathToIdArray(humanPath.split("."), tree["humanTree"]);
                                    if (humanOnt === "MESH")
                                        tempPathIdArray.unshift("mesh");
                                    else
                                        tempPathIdArray.unshift("HP:0000001");
                                    tempPathIdArray = this.convertNodesToNodeIDs(tempPathIdArray, true);
                                    tempPathIdArray.forEach(id => expandedHumanNodes.push(id));
                                }
                                // mousePaths.forEach(mousePath => this.pathToIdArray(mousePath.split("."), tree["mouseTree"]).forEach(id => expandedMouseNodes.push(id)));
                            } else {
                                expandedHumanNodes = this.pathToIdArray(humanPaths[0].split("."), tree["humanTree"]);
                                if (humanOnt === "MESH")
                                    expandedHumanNodes.unshift("mesh");
                                else
                                    expandedHumanNodes.unshift("HP:0000001");
                                expandedHumanNodes = this.convertNodesToNodeIDs(expandedHumanNodes, true);
                            }

                            selectedHumanNodes = expandedHumanNodes.filter(term => term.endsWith(tree["humanID"]));
                            expandedHumanNodes = expandedHumanNodes.filter(node => node.endsWith(tree["humanID"]) === false);
                        }
                        // populate mouse tree if result returned.
                        if (response.data.mouseID) {
                            breakdownType = 2;
                            tree["mouseID"] = response.data.mouseID;
                            tree["mouseTree"] = response.data.mouseTree;
                            let mousePaths = this.objectToPaths(tree["mouseTree"], tree["mouseID"]);
                            if (mousePaths.length > 1) {
                                for (var i = 0; i < mousePaths.length; i++) {
                                    let mousePath = mousePaths[i];
                                    let tempPathIdArray = this.pathToIdArray(mousePath.split("."), tree["mouseTree"]);
                                    tempPathIdArray.unshift("MP:0000001");
                                    tempPathIdArray = this.convertNodesToNodeIDs(tempPathIdArray, false);
                                    tempPathIdArray.forEach(id => expandedMouseNodes.push(id));
                                }
                                // mousePaths.forEach(mousePath => this.pathToIdArray(mousePath.split("."), tree["mouseTree"]).forEach(id => expandedMouseNodes.push(id)));
                            } else {
                                expandedMouseNodes = this.pathToIdArray(mousePaths[0].split("."), tree["mouseTree"]);
                                expandedMouseNodes.unshift("MP:0000001");
                                expandedMouseNodes = this.convertNodesToNodeIDs(expandedMouseNodes, false);
                            }
                            selectedMouseNodes = expandedMouseNodes.filter(term => term.endsWith(tree["mouseID"]));
                            expandedMouseNodes = expandedMouseNodes.filter(node => node.endsWith(tree["mouseID"]) === false);
                        }
                        // populate mapping data if available
                        if (response.data.mouseID && response.data.humanID) {
                            breakdownType = 0;
                            tree["isExactMatch"] = response.data.isExactMatch;
                        }


                        this.setState({
                            treeData: tree,
                            isDataPresent: true,
                            isMappingPresent: true,
                            expandedMouseNodes: expandedMouseNodes,
                            selectedMouseNodes: selectedMouseNodes,
                            expandedHumanNodes: expandedHumanNodes,
                            selectedHumanNodes: selectedHumanNodes,
                            mappedMousePhenotype: tree["mouseID"],
                            mappedHumanPhenotype: tree["humanID"],
                            humanSearchFailed: false,
                            mouseSearchFailed: false,
                            breakdownType: breakdownType,
                        }, () => this.scrollTrees());
                    } else {
                        this.setState({
                            isDataPresent: false,
                            isMappingPresent: false,
                            humanSearchFailed: searchOnt !== "MP",
                            mouseSearchFailed: searchOnt === "MP"
                        });
                    }
                }
            })
            .catch((error) => {
                this.setState({searchOpen: true});
                console.log("An error occurred searching for ontology mappings.");
                this.props.setLoading(false);
            });
    }

    updateTree = (id, children) => obj => {
        if (obj.id === id) {
            obj.children = children;
        } else if (!_.isEmpty(obj.children))
            return obj.children.some(this.updateTree(id, children));
    }

    getRootTrees = (ontology = null) => {
        this.props.setLoading(true);
        let ont = ontology ? ontology : "HPO";
        let url_string = this.state.configData.api_server + "controller.php?type=ontology&getRoots&ontology=" + ont;
        axios.get(url_string)
            .then((response) => {
                if (response.status === 200) {
                    if (response.data) {
                        let expandedMouseNodes = ["mouseTree-" + response.data.mouseID];
                        let expandedHumanNodes = ["humanTree-" + response.data.humanID];
                        this.setState({
                            treeData: response.data,
                            expandedMouseNodes: expandedMouseNodes,
                            expandedHumanNodes: expandedHumanNodes,
                        });
                        this.props.setLoading(false);
                    } else {

                    }
                }
            })
            .catch((error) => {
                console.log("An error occurred retrieving root tree data.");
                this.setState({conErrorStatus: true});
                this.props.setLoading(false);
            });
    }

    getRootTree = (ontology, species) => {
        this.props.setLoading(true);
        let mappingOnt = ontology === "MP" ? this.state.humanOntology : "MP";
        let url_string = this.state.configData.api_server + "controller.php?type=ontology&getRoot&ontology=" + ontology + "&mappingOnt=" + mappingOnt;
        axios.get(url_string)
            .then((response) => {
                if (response.status === 200) {
                    if (response.data) {
                        if (species === "human") {
                            let expandedHumanNodes = ["humanTree-term-1"];
                            let tree = this.state.treeData;
                            tree["humanTree"] = response.data.tree;
                            this.setState({treeData: tree, expandedHumanNodes: expandedHumanNodes});
                            this.props.setLoading(false);
                        } else {
                            let expandedMouseNodes = ["mouseTree-term-1"];
                            let tree = this.state.treeData;
                            tree["mouseTree"] = response.data.tree;
                            this.setState({treeData: tree, expandedMouseNodes: expandedMouseNodes});
                            this.props.setLoading(false);
                        }
                    }
                }
            })
            .catch((error) => {
                console.log("An error occurred retrieving root tree data.");
                this.setState({conErrorStatus: true});
                this.props.setLoading(false);
            });
    }

    getTermChildren = (e, tree, ont) => {
        let url_string = this.state.configData.api_server + "/controller.php?type=ontology&childSearch&term=" + e + "&ontology=" + ont + "&mappingOntology=" + this.state.humanOntology;
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
                this.setState({searchOpen: true, tableData: null});
                console.log("An error occurred searching for ontology mappings.");
            });
    }

    termSearchBtnClick = (term) => {
        this.setState({searchInput: term});
        this.search();
    }

    genotypeHandler = () => {
        this.setState({genotypeTermID: this.state.breakdownType !== 2 ? this.state.treeData.humanID : this.state.treeData.mouseID, genotypeOntology: this.state.breakdownType !== 2 ? this.state.humanOntology : "MP"});
    }

    mouseSearchBtnClick = (e) => {
        let input = typeof e === "string" ? e : document.getElementById("mouseSearchInput").value;
        this.setState({mouseSearchInput: input});
        this.search(input, "MP");
    }

    humanSearchBtnClick = (e) => {
        let input = typeof e === "string" ? e : document.getElementById("humanSearchInput").value;
        this.setState({humanSearchInput: input});
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
        let termID = event.currentTarget.parentNode.dataset["term"];
        let nodeID = event.currentTarget.parentNode.id;
        var loadingRequired = this.isLoadingRequired(termID, tree);
        if (loadingRequired) {
            this.getTermChildren(termID, "mouse", "mp");
        }
        this.setState({expandedMouseNodes: nodeIds});
    }

    handleMouseSelect = (event, nodeIds) => {
        this.setState({selectedMouseNodes: nodeIds});
    }

    handleHumanToggle = (event, nodeIds) => {
        let tree = this.state.treeData.humanTree;
        let termID = event.currentTarget.parentNode.dataset["term"];
        let nodeID = event.currentTarget.parentNode.id;
        var loadingRequired = this.isLoadingRequired(termID, tree);
        if (loadingRequired) {
            this.getTermChildren(termID, "human", this.state.humanOntology);
        }
        this.setState({expandedHumanNodes: nodeIds});
    }

    handleHumanSelect = (event, nodeIds) => {
        this.setState({selectedHumanNodes: nodeIds});
    }

    scrollTrees = () => {
        if (this.state.mappedMousePhenotype && this.state.isMappingPresent) {
            var obj = this;
            window.setTimeout(function () {
                let humanPhenotype = obj.state.mappedHumanPhenotype;
                let mousePhenotype = obj.state.mappedMousePhenotype;
                let mouseElement = document.getElementById($("#mouseTree li[data-term='" + mousePhenotype + "']")[0].id);
                let humanElement = document.getElementById($("#humanTree li[data-term='" + humanPhenotype + "']")[0].id);
                $("#humanTree").scrollTop(0);
                $("#mouseTree").scrollTop(0);
                $('#humanTree').animate({
                    scrollTop: $(humanElement).offset().top - ($("#humanTree").position().top + 90)
                }, 1500);
                $('#mouseTree').animate({
                    scrollTop: $(mouseElement).offset().top - ($("#mouseTree").position().top + 90)
                }, 1500);
                obj.setState({mappedMousePhenotype: null, mappedHumanPhenotype: null});
            }, 500);

        }
        this.props.setLoading(false);
    }

    getHumanPhenotypeBreakdown = (e) => {
        let treeData = this.state.treeData;
        treeData.humanID = e;
        treeData.mouseID = null;
        this.props.setLoading(true);
        this.setState({treeData: treeData, mouseID: null, isDataPresent: true, isMappingPresent: false, breakdownType: 1});
    }

    getMousePhenotypeBreakdown = (e) => {
        let treeData = this.state.treeData;
        treeData.humanID = null;
        treeData.mouseID = e;
        this.props.setLoading(true);
        this.setState({treeData: treeData, mouseID: null, isDataPresent: true, isMappingPresent: false, breakdownType: 2});
    }

    onBreakdownFinish = (e) => {
        this.props.setLoading(false);
    }

    changeHumanOntology = (e) => {
        this.setState({
            humanOntology: e.target.value,
            selectedHumanNodes: [''],
            expandedHumanNodes: [''],
            selectedMouseNodes: [''],
            expandedMouseNodes: [''],
            isMappingPresent: false,
            isDataPresent: false,
        });
        this.getRootTrees(e.target.value);
    }

    getPhenotypeBreakdownComponent = () => {
        switch (this.state.breakdownType) {
            case 0:
                return <PhenotypeResultBreakdown genotypeHandler={this.genotypeHandler}
                                          mousePhenotype={this.state.treeData.mouseID}
                                          humanPhenotype={this.state.treeData.humanID}
                                          humanOntology={this.state.humanOntology}
                                          onBreakdownFinish={this.onBreakdownFinish}/>;
            case 1:
                return <PhenotypeResultBreakdown genotypeHandler={this.genotypeHandler}
                                          humanPhenotype={this.state.treeData.humanID}
                                          humanOntology={this.state.humanOntology}
                                          onBreakdownFinish={this.onBreakdownFinish}/>;
            case 2:
                return <PhenotypeResultBreakdown genotypeHandler={this.genotypeHandler}
                                          mousePhenotype={this.state.treeData.mouseID}
                                          onBreakdownFinish={this.onBreakdownFinish}/>;
        }
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
            mouseSearchInput,
            humanSearchInput
        } = this.state;
        const mouseTree = treeData ? treeData.mouseTree : null;
        const humanTree = treeData ? treeData.humanTree : null;

        if (conErrorStatus)
            throw new Error("A connection error occurred retrieving ontology trees.");

        return (<SwitchTransition>
            <CSSTransition
                key={this.state.genotypeTermID}
                addEndListener={(node, done) => node.addEventListener("transitionend", done, false)}
                classNames='fade'
            >{!this.state.genotypeTermID ? (
                <div class="pageContainer">
                    <ErrorBoundary>
                        <Grid container spacing={2}>
                            <Grid item xs>
                                <Paper id="humanTreeWrapper" className={classes.paper}>
                                    <InputLabel id="human-ont-input-label">Human Ontology</InputLabel>
                                    <Select
                                        labelId="human-ont-input-label"
                                        id="human-ont-input-select"
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
                                        defaultValue={humanSearchInput}
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
                                                                <CircularProgress color="inherit"
                                                                                  size={20}/> : null}
                                                            {params.InputProps.endAdornment}
                                                        </React.Fragment>
                                                    ),
                                                }}
                                                onKeyDown={e => {
                                                    if (e.keyCode === 13) {
                                                        this.humanSearchBtnClick();
                                                    }
                                                }}
                                            />
                                        )}
                                        options={this.state.humanLiveSearchResults}
                                        getOptionLabel={(option) => option.FSN ? option.FSN : this.state.humanSearchInput}
                                        renderOption={(option) => option.FSN + " (" + option.type + ")"}/>
                                    <p>Search for terms with mappings to the MP ontology</p>
                                    <Button size="large" color="primary" variant="contained" id="search_btn"
                                            onClick={this.humanSearchBtnClick}>Search</Button>
                                    {this.state.humanSearchFailed ?
                                        <p style={{color: "red"}}>No match found.</p> : null}
                                    {
                                        !humanTree ? null :
                                            <OntologyTree treeID="humanTree"
                                                          selectedPhenotypeLabel={mappedHumanPhenotype}
                                                          onMappingClick={this.humanSearchBtnClick}
                                                          expanded={expandedHumanNodes}
                                                          onBtnClick={this.getHumanPhenotypeBreakdown}
                                                          selected={selectedHumanNodes}
                                                          onSelect={this.handleHumanSelect}
                                                          onToggle={this.handleHumanToggle} treeData={humanTree}
                                                          sourceOntology={this.state.humanOntology}
                                                          mappingOntology="MP"/>
                                    }

                                </Paper>
                            </Grid>
                            <Grid item xs>
                                {
                                    this.state.isDataPresent ? this.getPhenotypeBreakdownComponent() : null

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
                                            defaultValue={mouseSearchInput}
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
                                                                    <CircularProgress color="inherit"
                                                                                      size={20}/> : null}
                                                                {params.InputProps.endAdornment}
                                                            </React.Fragment>
                                                        ),
                                                    }}
                                                    onKeyDown={e => {
                                                        if (e.keyCode === 13) {
                                                            this.mouseSearchBtnClick();
                                                        }
                                                    }}
                                                />
                                            )}
                                            options={this.state.mouseLiveSearchResults}
                                            getOptionLabel={(option) => option.FSN ? option.FSN : this.state.mouseSearchInput}
                                            renderOption={(option) => option.FSN + " (" + option.type + ")"}/>
                                        <p>Search for MP terms which map to the selected human ontology.</p>
                                        <Button size="large" color="primary" variant="contained" id="search_btn"
                                                onClick={this.mouseSearchBtnClick}>Search</Button>
                                        {this.state.mouseSearchFailed ?
                                            <p style={{color: "red"}}>No match found.</p> : null}
                                    </div>
                                    {!mouseTree ? null :
                                        <OntologyTree treeID="mouseTree"
                                                      selectedPhenotypeLabel={mappedMousePhenotype}
                                                      onMappingClick={this.mouseSearchBtnClick}
                                                      expanded={expandedMouseNodes}
                                                      onBtnClick={this.getMousePhenotypeBreakdown}
                                                      selected={selectedMouseNodes}
                                                      onSelect={this.handleMouseSelect}
                                                      onToggle={this.handleMouseToggle} treeData={mouseTree}
                                                      sourceOntology="MP" mappingOntology="HPO"/>}
                                </Paper>
                            </Grid>
                        </Grid>
                    </ErrorBoundary>
                </div>) : <div>
                <Button size="large" color="primary" variant="contained" onClick={() => this.setState({
                    genotypeTermID: null,
                    genotypeOntology: null
                })}>Back</Button><br/>
                <Genome genotypeTermID={this.state.genotypeTermID}
                        genotypeOntology={this.state.genotypeOntology}/>
            </div>}
            </CSSTransition>
        </SwitchTransition>);
    }
}

export default withStyles(useStyles)(OntologyHierarchy);