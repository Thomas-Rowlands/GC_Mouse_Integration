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
import {useSpring, animated} from 'react-spring/web.cjs';
import Collapse from '@material-ui/core/Collapse';
import PropTypes from 'prop-types';
import ArrowRightIcon from "@material-ui/icons/ArrowRight";
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import SearchIcon from '@material-ui/icons/Search';
import Divider from '@material-ui/core/Divider';
import ErrorBoundary from "../UtilityComponents/ErrorBoundary";
import OntologyTree from "./Components/OntologyTree/OntologyTree";

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
            expandedMouseNodes: [''],
            expandedHumanNodes: [''],
            selectedMouseNodes: [''],
            selectedHumanNodes: [''],
            selectedSpecies: "Mouse",
            isMappingPresent: false,
            conErrorStatus: false,
        };
        this.getRootTree = this.getRootTree.bind(this);
        this.getMappingData = this.getMappingData.bind(this);
        this.tempExpandedmouseIds = [];
        this.tempExpandedhumanIds = [];
    }

    componentDidMount() {
        this.getRootTree();
    }

    retrieveLiveSearch = (e, x) => {
        let input = x;
        let species = e.target.id === "mouseSearchBtn" ? "mouse" : "human";
        this.setState({searchInput: input});
        if (input.length < 1) {
            $("#live-search").hide();
            return;
        }
        this.setState({liveLoading: true});
        let url_string = configData.api_server + "livesearch.php?entry=" + encodeURIComponent(input) + "&species=" + species;
        if (input.length > 0) {
            axios.get(url_string)
                .then((response) => {
                    if (response.status === 200) {
                        if (response.data.length == 0) {
                        } else {
                            if (species === "mouse")
                                this.setState({mouseLiveSearchResults: response.data, liveLoading: false});
                            else
                                this.setState({humanLiveSearchResults: response.data, liveLoading: false});
                        }
                    }
                })
                .catch((error) => {
                    console.log("An error occurred retrieving live search results.");
                });
        }
    }

    getRootTree = () => {
        this.setState({loading: true});
        let url_string = configData.api_server + "controller.php?type=ontology&search&term=GET_ROOT&ontology=mp";
        axios.get(url_string)
            .then((response) => {
                if (response.status === 200) {
                    if (response.data) {
                        let expandedMouseNodes = [];
                        expandedMouseNodes.push(response.data.mouseID);
                        this.setState({
                            treeData: response.data,
                            loading: false,
                            expandedMouseNodes: expandedMouseNodes
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

    search = () => {
        this.setState({loading: true});
        let search_input = this.state.searchInput;
        if (search_input === undefined || search_input === "") {
            this.getRootTree();
            return;
        }
        let url_string = configData.api_server + "/controller.php?type=ontology&search&term=" + search_input + "&ontology=mp";
        axios.get(url_string)
            .then((response) => {
                if (response.status === 200) {
                    if (response.data) {
                        let tree = this.state.treeData;
                        tree["humanID"] = response.data.humanID;
                        tree["mouseID"] = response.data.mouseID;
                        tree["isExactMatch"] = response.data.isExactMatch;
                        this.setState({
                            treeData: tree,
                            loading: false,
                            isMappingPresent: true,
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
        this.setState({searchInput: document.getElementById("mouseSearchInput").value});
        this.search();
    }

    getTreeNodes = (nodes) => {
        const {classes} = this.props;
        const btn = <Button size="small" onClick={() => this.termSearchBtnClick(nodes.FSN)} color="primary"
                            variant="outlined" id={nodes.id}
        ><SearchIcon fontSize="small"/></Button>;
        const tempChildNode = ("hasChildren" in nodes) && !("isa" in nodes) ?
            <StyledTreeItem labelText={<CircularProgress color="inherit" size={15}/>}/> : null;
        return (
            <StyledTreeItem onLabelClick={(e) => e.preventDefault()} key={nodes.id} nodeId={nodes.id}
                            labelText={nodes.FSN} labelIcon={btn}>
                {Array.isArray(nodes.isa) ? nodes.isa.map((node) => this.getTreeNodes(node)) : tempChildNode}
            </StyledTreeItem>
        );
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

    getMappingData = () => {

    }

    handleMouseToggle = (event, nodeIds) => {
        if (!this.state.expandedMouseNodes.includes(nodeIds[0])) {
            this.getTermChildren(nodeIds[0], "mouse", "mp");
        }
        this.setState({expandedMouseNodes: nodeIds});
    }

    handleMouseSelect = (event, nodeIds) => {
        this.setState({selectedMouseNodes: nodeIds});
    }

    handleHumanToggle = (event, nodeIds) => {
        if (!this.state.expandedHumanNodes.includes(nodeIds[0])) {
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
            liveLoading,
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
        let mouseTree = null;
        let humanTree = null;
        if (loading === false) {
            if (treeData) {
                mouseTree = treeData.mouseTree;
                humanTree = treeData.humanTree;
            }
        }
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
                                                        {liveLoading ?
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
                            {loading ? null : <OntologyTree expanded={expandedMouseNodes} selected={selectedMouseNodes} onSelect={this.handleMouseSelect} onToggle={this.handleMouseToggle} treeData={mouseTree}/>}

                        </Paper>
                    </Grid>
                    <Grid item xs>
                        {
                            this.state.isMappingPresent ?
                                <Paper id="mappingInfoWrapper" style={{marginTop: '50%'}} className={classes.paper}>
                                    <Typography gutterBottom variant="h5">Mapping Result Found!</Typography>
                                    <Typography variant="body2">A mapping has been found using an automated mapping
                                        algorithm.</Typography>
                                    <Divider variant="middle"/>
                                    <Grid container spacing={2}>
                                        <Grid item xs>
                                            <Typography gutterBottom variant="h6">Mouse</Typography>
                                            <Divider variant="middle"/>
                                            <Typography gutterBottom
                                                        variant="body">{this.state.treeData.mouseID}</Typography>
                                        </Grid>
                                        <Grid item xs>
                                            <Typography gutterBottom variant="h6">Human</Typography>
                                            <Divider variant="middle"/>
                                            <Typography gutterBottom
                                                        variant="body">{this.state.treeData.humanID}</Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>
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
                                                    {liveLoading ?
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
                                loading ? null : <OntologyTree expanded={expandedHumanNodes} selected={selectedHumanNodes} onSelect={this.handleHumanSelect} onToggle={this.handleHumanToggle} treeData={humanTree}/>
                            }

                        </Paper>
                    </Grid>
                </Grid>
            </ErrorBoundary>

        </div>
    }
}

export default withStyles(useStyles)(OntologyHierarchy);