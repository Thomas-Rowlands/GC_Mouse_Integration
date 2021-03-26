import React from 'react';
import $ from 'jquery';
import axios from "axios";
import {Button, Grid, Paper, TextField, withStyles} from '@material-ui/core';
import StyledTreeItem from './Components/OntologyTree/Components/StyledTreeItem';
import Typography from '@material-ui/core/Typography';
import LoadingSpinner from "../UtilityComponents/LoadingSpinner/LoadingSpinner";
import configData from '../Config/config.json';
import './OntologyHierarchy.css';
import Autocomplete from "@material-ui/lab/Autocomplete";
import CircularProgress from "@material-ui/core/CircularProgress";
import SearchIcon from '@material-ui/icons/Search';
import Divider from '@material-ui/core/Divider';
import ErrorBoundary from "../UtilityComponents/ErrorBoundary";
import OntologyTree from "./Components/OntologyTree/OntologyTree";
import _ from "lodash";
import {array} from "prop-types";
import PhenotypeResultBreakdown from "../PhenotypeSearch/Components/PhenotypeResultBreakdown";

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
            loading: true,
            treeData: null,
            mouseLiveSearchResults: [],
            humanLiveSearchResults: [],
            mouseLiveLoading: false,
            humanLiveLoading: false,
            expandedMouseNodes: [''],
            expandedHumanNodes: [''],
            selectedMouseNodes: [''],
            selectedHumanNodes: [''],
            selectedSpecies: "Mouse",
            isMappingPresent: false,
            conErrorStatus: false,
        };
        this.tempExpandedmouseIds = [];
        this.tempExpandedhumanIds = [];
    }

    componentDidMount() {
        this.getRootTree();
    }

    retrieveLiveSearch = (e, x) => {
        let input = x;
        let species = e.target.id === "mouseSearchInput" ? "mouse" : "human";
        if (input.length < 1) {
            $("#live-search").hide();
            if (species === "mouse")
                this.setState({mouseLiveLoading: false});
            else
                this.setState({humanLiveLoading: false});
            return;
        }
        if (species === "mouse")
            this.setState({mouseLiveLoading: true});
        else
            this.setState({humanLiveLoading: true});
        this.setState({searchInput: input});


        let url_string = configData.api_server + "livesearch.php?entry=" + encodeURIComponent(input) + "&species=" + species;
        if (input.length > 0) {
            axios.get(url_string)
                .then((response) => {
                    if (response.status === 200) {
                        if (response.data.length == 0) {
                            if (species === "mouse") {
                                this.setState({mouseLiveSearchResults: [], mouseLiveLoading: false});
                            } else {
                                this.setState({humanLiveSearchResults: [], humanLiveLoading: false});
                            }
                        } else {
                            if (species === "mouse") {
                                this.setState({mouseLiveSearchResults: response.data, mouseLiveLoading: false});
                            } else {
                                this.setState({humanLiveSearchResults: response.data, humanLiveLoading: false});
                            }
                        }
                    }
                })
                .catch((error) => {
                    console.log("An error occurred retrieving live search results.");
                    if (species === "mouse") {
                        this.setState({mouseLiveSearchResults: [], mouseLiveLoading: false});
                    } else {
                        this.setState({humanLiveSearchResults: [], humanLiveLoading: false});
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

    expandSiblings = (tree) => {
        if (tree.hassibling) {
            let newTree = tree.hassibling;
            newTree.filter((node) => !this.isNodeDuplicate(tree, node));
            delete tree.hassibling;
            newTree.push(tree);
            tree = newTree;
            tree = _.sortBy(tree, o => o.FSN);
        }
        if (_.isArray(tree)) {
            if (tree.length > 0) {
                var test = [];
                for (var i = 0; i < tree.length; i++) {
                    if (tree[i].isa) {
                        tree[i].isa = tree[i].isa.map((node) => this.expandSiblings(node));
                        if (Array.isArray(tree[i].isa[0]))
                            tree[i].isa = tree[i].isa[0];
                        tree[i].isa = _.sortBy(tree[i].isa, o => o.FSN);
                    }
                    if (tree[i].hassibling) {
                        let newTree = tree[i].hassibling;
                        newTree.filter((node) => !this.isNodeDuplicate(tree, node));
                        delete tree[i].hassibling;
                        tree.push(newTree);
                    }
                }
                tree = _.sortBy(tree, o => o.FSN);
            } else {
                if (tree[0].isa) {
                    tree[0].isa = tree[0].isa.map((node) => this.expandSiblings(node));
                    if (Array.isArray(tree[0].isa[0]))
                        tree[0].isa = tree[0].isa[0];
                    tree[0].isa = _.sortBy(tree.isa[0], o => o.FSN);
                }
                if (tree[0].hassibling) {
                    let newTree = tree[0].hassibling;
                    newTree.filter((node) => !this.isNodeDuplicate(tree, node));
                    delete tree[0].hassibling;
                    newTree.push(tree[0]);
                    tree.push(newTree);
                    tree = _.sortBy(tree, o => o.FSN);
                }
            }
        } else if (tree.isa) {
            tree.isa = tree.isa.map((node) => this.expandSiblings(node));
            if (Array.isArray(tree.isa[0]))
                tree.isa = tree.isa[0];
            tree.isa = _.sortBy(tree.isa, o => o.FSN);
        }
        return tree;
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

    pathToIdArray = (path, tree) => {
        var result = [];
        for (var i = 1; i < path.length; i += 2) {
            result.push(tree.isa[path[i]].id);
            tree = tree.isa[path[i]];
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

    search = (searchInput, ontology) => {
        this.setState({loading: true, isMappingPresent: false});
        if (searchInput === undefined || searchInput === "") {
            this.getRootTree();
            return;
        }
        let url_string = configData.api_server + "controller.php?type=ontology&search&term=" + searchInput + "&ontology=" + ontology;
        axios.get(url_string)
            .then((response) => {
                if (response.status === 200) {
                    if (response.data) {
                        let tree = this.state.treeData;
                        let expandedMouseNodes = [];
                        let expandedHumanNodes = [];
                        response.data.mouseTree = this.expandSiblings(response.data.mouseTree);
                        response.data.humanTree = this.expandSiblings(response.data.humanTree);
                        tree["humanID"] = response.data.humanID;
                        tree["mouseID"] = response.data.mouseID;
                        tree["isExactMatch"] = response.data.isExactMatch;
                        tree["mouseTree"] = _.mergeWith(response.data.mouseTree,tree["mouseTree"],  this.appendSearchResult);//this.mergeDeep(tree["mouseTree"], response.data.mouseTree);
                        var test = this.findPath(tree["mouseID"], tree["mouseTree"]);
                        expandedMouseNodes = this.pathToIdArray(this.findPath(tree["mouseID"], tree["mouseTree"]).split("."), tree["mouseTree"]);
                        expandedMouseNodes.unshift("MP:0000001");
                        expandedMouseNodes.pop();
                        tree["humanTree"] = _.mergeWith(response.data.humanTree,tree["humanTree"], this.appendSearchResult);//this.mergeDeep(tree["humanTree"], response.data.humanTree);
                        expandedHumanNodes = this.pathToIdArray(this.findPath(tree["humanID"], tree["humanTree"]).split("."), tree["humanTree"]);
                        expandedHumanNodes.unshift("HP:0000001");
                        expandedHumanNodes.pop();
                        this.setState({
                            treeData: tree,
                            loading: false,
                            isMappingPresent: true,
                            expandedMouseNodes: expandedMouseNodes,
                            selectedMouseNodes: tree["mouseID"],
                            expandedHumanNodes: expandedHumanNodes,
                            selectedHumanNodes: tree["humanID"],
                        });
                    } else {
                        this.setState({loading: false, isMappingPresent: false});
                    }
                }
            })
            .catch((error) => {
                this.setState({loading: false, searchOpen: true});
                console.log("An error occurred searching for ontology mappings.");
            });
    }

    updateTree = (id, isa) => obj => {
        if (obj.id === id) {
            obj.isa = isa.isa;
            return true;
        } else if (obj.isa)
            return obj.isa.some(this.updateTree(id, isa));
    }

    getRootTree = () => {
        this.setState({loading: true});
        let url_string = configData.api_server + "controller.php?type=ontology&search&term=GET_ROOT&ontology=mp";
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
    getTermChildren = (e, tree, ont) => {
        let url_string = configData.api_server + "/controller.php?type=ontology&childSearch&term=" + e + "&ontology=" + ont;
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
        this.search(input, "mp");
    }

    humanSearchBtnClick = (e) => {
        let input = typeof e === "string" ? e : document.getElementById("humanSearchInput").value;
        this.search(input, "hpo");
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
        if (obj.id === id && !obj.isa) {
            return true;
        } else if (obj.isa) {
            for (var i = 0; i < obj.isa.length; i++) {
                if (this.isLoadingRequired(id, obj.isa[i]))
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
            this.getTermChildren(nodeIds[0], "human", "hpo");
        }
        this.setState({expandedHumanNodes: nodeIds});
    }

    handleHumanSelect = (event, nodeIds) => {
        this.setState({selectedHumanNodes: nodeIds});
    }


    render() {
        const {classes} = this.props;
        const {
            mouseLiveLoading,
            humanLiveLoading,
            loading,
            mouseLiveSearchResults,
            humanLiveSearchResults,
            treeData,
            conErrorStatus,
            selectedMouseNodes,
            selectedHumanNodes,
            expandedMouseNodes,
            expandedHumanNodes,
        } = this.state;
        const mouseTree = treeData ? treeData.mouseTree : null;
        const humanTree = treeData ? treeData.humanTree : null;
        if (conErrorStatus)
            throw new Error("A connection error occurred retrieving ontology trees.");
        return <div>
            <ErrorBoundary>
                <Grid container spacing={3}>
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
                                                        {mouseLiveLoading ?
                                                            <CircularProgress color="inherit" size={20}/> : null}
                                                        {params.InputProps.endAdornment}
                                                    </React.Fragment>
                                                ),
                                            }}
                                        />
                                    )}
                                    options={mouseLiveSearchResults.map((option) => option.FSN)}/>

                                <Button size="large" color="primary" variant="contained" id="search_btn"
                                        onClick={this.mouseSearchBtnClick}>Search</Button>
                            </div>
                            <LoadingSpinner loading={loading}/>
                            {!mouseTree ? null :
                                <OntologyTree onBtnClick={this.mouseSearchBtnClick} expanded={expandedMouseNodes}
                                              selected={selectedMouseNodes} onSelect={this.handleMouseSelect}
                                              onToggle={this.handleMouseToggle} treeData={mouseTree}
                                              sourceOntology="MP" mappingOntology="HPO"/>}
                        </Paper>
                    </Grid>
                    <Grid item xs>
                        {
                            this.state.isMappingPresent ?
                                <PhenotypeResultBreakdown selectedPhenotype={this.state.treeData.mouseID}/>
                                // <Paper id="mappingInfoWrapper" style={{marginTop: '50%'}} className={classes.paper}>
                                //     <Typography gutterBottom variant="h5">Mapping Result Found!</Typography>
                                //     <Divider variant="middle"/>
                                //     <Grid container spacing={2}>
                                //         <Grid item xs>
                                //             <Typography gutterBottom variant="h6">Mouse</Typography>
                                //             <Divider variant="middle"/>
                                //             <Typography gutterBottom
                                //                         variant="body1">{this.state.treeData.mouseID}</Typography>
                                //         </Grid>
                                //         <Grid item xs>
                                //             <Typography gutterBottom variant="h6">Human</Typography>
                                //             <Divider variant="middle"/>
                                //             <Typography gutterBottom
                                //                         variant="body1">{this.state.treeData.humanID}</Typography>
                                //         </Grid>
                                //     </Grid>
                                // </Paper>
                                : null
                        }
                    </Grid>
                    <Grid item xs>
                        <Paper id="humanTreeWrapper" className={classes.paper}>
                            <h3>Human Phenotype</h3>
                            <Autocomplete
                                freeSolo
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
                                                    {humanLiveLoading ?
                                                        <CircularProgress color="inherit" size={20}/> : null}
                                                    {params.InputProps.endAdornment}
                                                </React.Fragment>
                                            ),
                                        }}
                                    />
                                )}
                                options={humanLiveSearchResults.map((option) => option.FSN)}/>

                            <Button size="large" color="primary" variant="contained" id="search_btn"
                                    onClick={this.search}>Search</Button>
                            {
                                !humanTree ? null :
                                    <OntologyTree onBtnClick={this.humanSearchBtnClick} expanded={expandedHumanNodes}
                                                  selected={selectedHumanNodes} onSelect={this.handleHumanSelect}
                                                  onToggle={this.handleHumanToggle} treeData={humanTree}
                                                  sourceOntology="HPO" mappingOntology="MP"/>
                            }

                        </Paper>
                    </Grid>
                </Grid>
            </ErrorBoundary>

        </div>
    }
}

export default withStyles(useStyles)(OntologyHierarchy);