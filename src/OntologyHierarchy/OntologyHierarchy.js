import React from 'react';
import $ from 'jquery';
import axios from "axios";
import {Button, Grid, Paper, TextField, withStyles} from '@material-ui/core';
import TreeView from "@material-ui/lab/TreeView";
import TreeItem from "@material-ui/lab/TreeItem";
import SvgIcon from '@material-ui/core/SvgIcon';
import LoadingSpinner from "../UtilityComponents/LoadingSpinner/LoadingSpinner";
import configData from '../Config/config.json';
import {fade, makeStyles} from '@material-ui/core/styles';
import './OntologyHierarchy.css';
import Autocomplete from "@material-ui/lab/Autocomplete";
import CircularProgress from "@material-ui/core/CircularProgress";
import {useSpring, animated} from 'react-spring/web.cjs';
import Collapse from '@material-ui/core/Collapse';
import PropTypes from 'prop-types';
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
    root: {
        flexGrow: 1,
        marginTop: 20,
        marginLeft: 5,
    },
    rootReverse: {
        flexGrow: 1,
        marginTop: 30,
        marginLeft: 10,
        marginRight: 10,
        flexDirection: "reverse",
    },
    paper: {
        padding: theme.spacing(1),
        textAlign: 'center',
        color: theme.palette.text.secondary,
    },
    highlight: {
        backgroundColor: "#a6a6ff",
    }
});
const StyledTreeItem = withStyles((theme) => ({
    iconContainer: {
        '& .close': {
            opacity: 0.3,
        },
    },
    group: {
        marginLeft: 7,
        paddingLeft: 18,
        borderLeft: `1px dashed ${fade(theme.palette.text.primary, 0.4)}`,
    },
}))((props) => <TreeItem {...props} TransitionComponent={TransitionComponent}/>);

function MinusSquare(props) {
    return (
        <SvgIcon fontSize="inherit" style={{width: 14, height: 14}} {...props}>
            {/* tslint:disable-next-line: max-line-length */}
            <path
                d="M22.047 22.074v0 0-20.147 0h-20.12v0 20.147 0h20.12zM22.047 24h-20.12q-.803 0-1.365-.562t-.562-1.365v-20.147q0-.776.562-1.351t1.365-.575h20.147q.776 0 1.351.575t.575 1.351v20.147q0 .803-.575 1.365t-1.378.562v0zM17.873 11.023h-11.826q-.375 0-.669.281t-.294.682v0q0 .401.294 .682t.669.281h11.826q.375 0 .669-.281t.294-.682v0q0-.401-.294-.682t-.669-.281z"/>
        </SvgIcon>
    );
}

function PlusSquare(props) {
    return (
        <SvgIcon fontSize="inherit" style={{width: 14, height: 14}} {...props}>
            {/* tslint:disable-next-line: max-line-length */}
            <path
                d="M22.047 22.074v0 0-20.147 0h-20.12v0 20.147 0h20.12zM22.047 24h-20.12q-.803 0-1.365-.562t-.562-1.365v-20.147q0-.776.562-1.351t1.365-.575h20.147q.776 0 1.351.575t.575 1.351v20.147q0 .803-.575 1.365t-1.378.562v0zM17.873 12.977h-4.923v4.896q0 .401-.281.682t-.682.281v0q-.375 0-.669-.281t-.294-.682v-4.896h-4.923q-.401 0-.682-.294t-.281-.669v0q0-.401.281-.682t.682-.281h4.923v-4.896q0-.401.294-.682t.669-.281v0q.401 0 .682.281t.281.682v4.896h4.923q.401 0 .682.281t.281.682v0q0 .375-.281.669t-.682.294z"/>
        </SvgIcon>
    );
}

function CloseSquare(props) {
    return (
        <SvgIcon className="close" fontSize="inherit" style={{width: 14, height: 14}} {...props}>
            {/* tslint:disable-next-line: max-line-length */}
            <path
                d="M17.485 17.512q-.281.281-.682.281t-.696-.268l-4.12-4.147-4.12 4.147q-.294.268-.696.268t-.682-.281-.281-.682.294-.669l4.12-4.147-4.12-4.147q-.294-.268-.294-.669t.281-.682.682-.281.696 .268l4.12 4.147 4.12-4.147q.294-.268.696-.268t.682.281 .281.669-.294.682l-4.12 4.147 4.12 4.147q.294.268 .294.669t-.281.682zM22.047 22.074v0 0-20.147 0h-20.12v0 20.147 0h20.12zM22.047 24h-20.12q-.803 0-1.365-.562t-.562-1.365v-20.147q0-.776.562-1.351t1.365-.575h20.147q.776 0 1.351.575t.575 1.351v20.147q0 .803-.575 1.365t-1.378.562v0z"/>
        </SvgIcon>
    );
}


function TransitionComponent(props) {
    const style = useSpring({
        from: {opacity: 0, transform: 'translate3d(20px,0,0)'},
        to: {opacity: props.in ? 1 : 0, transform: `translate3d(${props.in ? 0 : 20}px,0,0)`},
    });
    return (
        <animated.div style={style}>
            <Collapse {...props} />
        </animated.div>
    );
}

TransitionComponent.propTypes = {
    /**
     * Show the component; triggers the enter or exit states
     */
    in: PropTypes.bool,
};

class OntologyHierarchy extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            treeData: null,
            liveSearchResults: [],
            expandedSourceNodes: [''],
            expandedMappedNodes: [''],
            selectedSourceNodes: [''],
            selectedMappedNodes: [''],
            selectedSpecies: "Mouse"
        };
        this.getRootTree = this.getRootTree.bind(this);
        this.getMappingData = this.getMappingData.bind(this);
        this.tempExpandedSourceIds = [];
        this.tempExpandedMappedIds = [];
    }

    componentDidMount() {
        this.getRootTree();
    }

    retrieveLiveSearch = (e, x) => {
        let input = x;
        this.setState({searchInput: input});
        if (input.length < 1) {
            $("#live-search").hide();
            return;
        }
        this.setState({liveLoading: true});
        let url_string = configData.api_server + "livesearch.php?entry=" + encodeURIComponent(input) + "&species=" + this.state.selectedSpecies;
        if (input.length > 0) {
            axios.get(url_string)
                .then((response) => {
                    if (response.status === 200) {
                        if (response.data.length == 0) {
                        } else {
                            this.setState({liveSearchResults: response.data, liveLoading: false});
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
        let url_string = configData.api_server + "controller.php?type=ontology&ontologySearch&term=GET_ROOT&ontology=mp";
        axios.get(url_string)
            .then((response) => {
                if (response.status === 200) {
                    if (response.data) {
                        let expandedSourceNodes = [];
                        expandedSourceNodes.push(response.data.sourceID);
                        this.setState({
                            treeData: response.data,
                            loading: false,
                            expandedSourceNodes: expandedSourceNodes
                        });
                    } else {

                    }
                }
            })
            .catch((error) => {
                console.log("An error occurred retrieving root tree data.");
            });
    }

    search = () => {
        this.setState({loading: true});
        let search_input = this.state.searchInput;
        let url_string = configData.api_server + "/controller.php?type=ontology&ontologySearch&term=" + search_input + "&ontology=mp";
        axios.get(url_string)
            .then((response) => {
                if (response.status === 200) {
                    if (response.data) {
                        this.setExpandedSourceNodes(response.data.sourceTree, []);
                        this.setExpandedMappedNodes(response.data.mappedTree, []);
                        this.setState({
                            treeData: response.data,
                            loading: false,
                            expandedSourceNodes: this.tempExpandedSourceIds,
                            expandedMappedNodes: this.tempExpandedMappedIds,
                            selectedSourceNodes: [response.data.sourceID],
                            selectedMappedNodes: [response.data.mappedID]
                        });
                    } else {
                        this.setState({loading: false, treeData: null});
                    }
                }
            })
            .catch((error) => {
                this.setState({loading: false, searchOpen: true, tableData: null});
                console.log("An error occurred searching for ontology mappings.");
            });
    }

    getTreeNodes = (nodes) => {
        return (
            <TreeItem key={nodes.id} nodeId={nodes.id} label={nodes.FSN}>
                {Array.isArray(nodes.isa) ? nodes.isa.map((node) => this.getTreeNodes(node)) : null}
            </TreeItem>
        );
    }

    setExpandedSourceNodes = (nodes, ids) => {
        if (Array.isArray(ids[0]))
            ids = ids[0];
        ids.push(nodes.id);
        this.tempExpandedSourceIds = ids;
        return Array.isArray(nodes.isa) ? nodes.isa.map((node) => this.setExpandedSourceNodes(node, ids)) : ids;
    }
    setExpandedMappedNodes = (nodes, ids) => {
        if (Array.isArray(ids[0]))
            ids = ids[0];
        ids.push(nodes.id);
        this.tempExpandedMappedIds = ids;
        return Array.isArray(nodes.isa) ? nodes.isa.map((node) => this.setExpandedMappedNodes(node, ids)) : ids;
    }

    getMappingData = () => {

    }

    handleSourceToggle = (event, nodeIds) => {
        this.setState({expandedSourceNodes: nodeIds});
    }

    handleSourceSelect = (event, nodeIds) => {
        this.setState({selectedSourceNodes: nodeIds});
    }

    handleMappedToggle = (event, nodeIds) => {
        this.setState({expandedMappedNodes: nodeIds});
    }

    handleMappedSelect = (event, nodeIds) => {
        this.setState({selectedMappedNodes: nodeIds});
    }


    render() {
        const {classes} = this.props;
        const {
            liveLoading,
            loading,
            liveSearchResults,
            treeData,
            expandedSourceNodes,
            expandedMappedNodes,
            selectedSourceNodes,
            selectedMappedNodes
        } = this.state;
        return <div className={classes.root}>
            <Grid container spacing={3}>
                <Grid item xs>
                    <Paper id="sourceTreeWrapper" className={classes.paper}>
                        <div className="ontologySearchWrapper">
                            <h3>Mammalian Phenotype</h3>
                            <Autocomplete
                                freeSolo
                                className={classes.autoComplete}
                                onInputChange={this.retrieveLiveSearch}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Term search"
                                        variant="outlined"
                                        // onChange={this.retrieveLiveSearch}
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
                                options={liveSearchResults.map((option) => option.FSN)}/>
                            <Button size="large" color="primary" variant="contained" id="search_btn"
                                    onClick={this.search}>Search</Button>


                        </div>
                        <LoadingSpinner loading={loading}/>
                        <TreeView className={classes.root} expanded={expandedSourceNodes}
                                  selected={selectedSourceNodes}
                                  defaultCollapseIcon={<MinusSquare/>} defaultExpandIcon={<PlusSquare/>}
                                  defaultEndIcon={<CloseSquare/>} onNodeToggle={this.handleSourceToggle}
                                  onNodeSelect={this.handleSourceSelect}>
                            {treeData ? this.getTreeNodes(treeData.sourceTree) : null}
                        </TreeView>
                    </Paper>
                </Grid>
                <Grid item xs>
                    <Paper id="mappingInfoWrapper" className={classes.paper}>
                        {
                            (this.state.treeData && this.state.treeData.mappedID) ?
                                <PhenotypeResultBreakdown selectedPhenotype={this.state.treeData.sourceID}
                                                          breakdownData={this.state.breakdownData}/> :
                                <h3>No Mapping Found...</h3>
                        }

                    </Paper>
                </Grid>
                <Grid item xs>
                    <Paper id="mappedTreeWrapper" className={classes.paper}>
                        <h3>Human Phenotype</h3>
                        <TreeView className={classes.rootReverse} expanded={expandedMappedNodes}
                                  selected={selectedMappedNodes}
                                  defaultCollapseIcon={<MinusSquare/>} defaultExpandIcon={<PlusSquare/>}
                                  defaultEndIcon={<CloseSquare/>} onNodeToggle={this.handleMappedToggle}
                                  onNodeSelect={this.handleMappedSelect}>
                            {treeData ? this.getTreeNodes(treeData.mappedTree) : null}
                        </TreeView>
                    </Paper>
                </Grid>
            </Grid>
        </div>
    }
}

export default withStyles(useStyles)(OntologyHierarchy);