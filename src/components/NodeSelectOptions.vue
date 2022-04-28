<template>
    <div>
        <h3>Select your node</h3>
        <ul>
            <li v-for="(list, nodetype) in nodeList">
                <input type="radio" :value="nodetype" v-model="nodeType">
                {{ nodetype }}

                <!-- v-model="nodeUrl[nodetype]" -->
                <select  class="arrow" v-model="urlObject[nodetype]">
                    <option v-for="url in list" :value="url">{{url}}</option>
                </select>
            </li>
        </ul>
    </div>
</template>

<script>
export default {
    data() {
        return {
            urlObject: {}
        }
    },
    watch: {
        urlObjectHistory: {
                handler(newObj, oldObj) {
                    if(Object.keys(oldObj).length === 0) return
                    for(let node in newObj) {
                        const newNodeUrl = newObj[node]
                        if(newNodeUrl !== oldObj[node]) {
                            if(this.getActiveNode.type === node) {
                                console.log('URL Changed to: ' + newNodeUrl)
                                this.setNodeType(node, newNodeUrl)
                            }
                        } 
                    }
            },
            deep: true
        }
    },
    computed: {
        getActiveNode() {
            return this.$store.getters.getActiveNode
        },
        nodeList() {
            return this.$store.getters.getNodeOptions
        },
        nodeType: {
            set(type) {
                this.setNodeType(type, this.urlObject[type])
            },
            get() {
                return this.$store.getters.getActiveNode?.type
            }
        },
        urlObjectHistory() {
            return Object.assign({}, this.urlObject)
        }
    },
    methods: {
        setUrlObject() {            
            for(let nodetype in this.nodeList) {
                this.urlObject[nodetype] = this.nodeList[nodetype][0]
            }
        },
        setNodeType(type, url) {
            this.$store.dispatch('setNodeType', { type, url })
        }
    },
    mounted() {
        this.setUrlObject()
    }
}
</script>

<style scoped>
ul {
    list-style-type: none;
}
li {
    display: flex;
    flex-direction: row;
}
</style>
