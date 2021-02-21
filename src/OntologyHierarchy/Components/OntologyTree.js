import {Paper, withStyles} from "@material-ui/core";
import {fade} from "@material-ui/core/styles";
import TreeItem from "@material-ui/lab/TreeItem";
import SvgIcon from "@material-ui/core/SvgIcon";
import {animated, useSpring} from "react-spring/web.cjs";
import Collapse from "@material-ui/core/Collapse";
import PropTypes from "prop-types";
import React from "react";
import $ from "jquery";
import configData from "../../Config/config.json";
import axios from "axios";
import TreeView from "@material-ui/lab/TreeView";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

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

class OntologyTree extends React.Component {

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

    search = (term) => {
        this.setState({loading: true});
        let url_string = configData.api_server + "/controller.php?type=ontology&ontologySearch&term=" + encodeURIComponent(term) + "&ontology=mp";
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
            loading,
            liveSearchResults,
            treeData,
            expandedSourceNodes,
            expandedMappedNodes,
            selectedSourceNodes,
            selectedMappedNodes
        } = this.state;
        return (
            <TreeView className={classes.rootReverse} expanded={expandedMappedNodes}
                      selected={selectedMappedNodes}
                      defaultCollapseIcon={<ExpandMoreIcon />} defaultExpandIcon={<ChevronRightIcon />} onNodeToggle={this.handleMappedToggle}
                      onNodeSelect={this.handleMappedSelect}>
                {treeData ? this.getTreeNodes(treeData.mappedTree) : null}
            </TreeView>
        );

    }

}

export default withStyles(useStyles)(OntologyTree);

