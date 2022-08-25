import {Button, withStyles} from "@material-ui/core";
import {animated, useSpring} from "react-spring/web.cjs";
import Collapse from "@material-ui/core/Collapse";
import PropTypes from "prop-types";
import React from "react";
import TreeView from "@material-ui/lab/TreeView";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import ArrowRightIcon from "@material-ui/icons/ArrowRight";
import CircularProgress from "@material-ui/core/CircularProgress";
import StyledTreeItem from "./Components/StyledTreeItem";
import _ from 'lodash';

const useStyles = theme => ({
    root: {
        marginTop: 20,
        marginLeft: 0,
        overflowY: "scroll",
        height: "75vh",
    },
    highlight: {
        backgroundColor: "#61aefd",
    },
    btn: {
        marginRight: 5
    }
});

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
            expandedNodes: [''],
            selectedNodes: [''],
            selectedSpecies: "Mouse",
            nodes: [],
            treeOntology: "",
            onToggle: null,
            onSelect: null,
            onMappingClick: null,
            onBtnClick: null,
            sourceOntology: "",
            mappingOntology: "",
            selectedPhenotypeLabel: "",
            treeID: "",
        };
    }

    getNodeButton = (node) => {
        const {classes} = this.props;
        if (node.hasExactMapping && node.hasData) {
            return <Button className={classes.btn} size="small" onClick={() => this.props.onMappingClick(node.id)}
                        color="primary" variant="outlined" style={{backgroundColor: "#e4e1fd"}} id={node.id}
                ><img alt="small icon of a man" width="20px" src={"/images/man.png"}/><img alt="small icon of a mouse"
                                                                                           width="20px"
                                                                                           src={"/images/mouse.png"}/></Button>;
        } else if (node.hasInferredMapping) {
            return <Button className={classes.btn} size="small" onClick={(e) => node.hasData ? this.props.onMappingClick(node.id) : e.preventDefault()}
                    color="primary" variant="outlined" id={node.id}
            ><img alt="small icon of a man" width="20px" src={"/images/man.png"}/><img
                alt="small icon of a mouse"
                width="20px"
                src={"/images/mouse.png"}/></Button>;
        } else if (node.hasData) {
            return <Button className={classes.btn} size="small" onClick={() => this.props.onBtnClick(node.id)}
                    color="primary" variant="outlined" id={node.id}
            ><img width="20px"
                  alt={this.props.treeID === "humanTree" ? "small icon of a man" : "small icon of a mouse"}
                  src={this.props.treeID === "humanTree" ? "/images/man.png" : "/images/mouse.png"}/></Button>;
        }
        return null;
    }

    getTreeNodes = (nodes, parentPath) => {
        const btn = this.getNodeButton(nodes);
        const tempChildNode = (nodes.hasChildren === true) && (_.isEmpty(nodes.children)) ?
            <StyledTreeItem hasChildren={nodes.hasChildren}
                            labelText={<CircularProgress color="inherit" size={15}/>}/> : null;
        if (!_.isEmpty(nodes.children)) {
            nodes.children = _.orderBy(nodes.children, ['label'], ['asc']); // all nodes must be sorted alphabetically!
        }
        let path = null;
        if (parentPath !== undefined)
            path = parentPath + "-" + nodes.id;
        else
            path = nodes.id;
        let id = this.props.treeID + "-" + path;
        return (
            <StyledTreeItem hasChildren={nodes.hasChildren} id={id} onLabelClick={(e) => e.preventDefault()}
                            key={nodes.id} nodeId={id}
                            data-term={nodes.id} labelText={nodes.label} labelIcon={btn}>
                {!_.isEmpty(nodes.children) ? Object.keys(nodes.children).map((key, index) => this.getTreeNodes(nodes.children[key], path)) : tempChildNode}
            </StyledTreeItem>
        );
    }


    render() {
        const {classes} = this.props;
        if (this.props.treeData === null || this.props.treeData === undefined) {
            throw new Error('No ontology data received.');
        }
        return (
            <TreeView id={this.props.treeID} className={classes.root} expanded={this.props.expanded}
                      selected={this.props.selected}
                      defaultCollapseIcon={<ArrowDropDownIcon/>} defaultExpandIcon={<ArrowRightIcon/>}
                      defaultEndIcon={<div style={{width: 24}}/>} onNodeToggle={this.props.onToggle}
                      onNodeSelect={this.props.onSelect}>
                {this.getTreeNodes(this.props.treeData)}
            </TreeView>
        );

    }

}

export default withStyles(useStyles)(OntologyTree);

