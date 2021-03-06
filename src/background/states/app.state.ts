import { State } from './state';
import { Metadata, VisualizationConfig, Graph, Layout } from '../../shared/data-format';
import { ProjectSymbols } from 'ngast';
import { ModuleTreeState } from './module-tree.state';
import { AppModuleState } from './app-module.state';
import { DirectiveState } from './directive.state';
import { ProviderState } from './provider.state';
import { PipeState } from './pipe.state';

const CompositeStateID = '$$$composite-state$$$';
const Title = 'Application View';

export class AppState extends State {
  private states: State[] = [];

  constructor(context: ProjectSymbols, private _showLibs: boolean) {
    super(CompositeStateID, context);
    this.init();
  }

  get showLibs() {
    return this._showLibs;
  }

  getMetadata(id: string): Metadata | null {
    return this.states.reduce((c: Metadata | null, s: State) => {
      if (c !== null) return c;
      return s.getMetadata(id);
    }, null);
  }

  nextState(id: string) {
    return null;
  }

  getData(): VisualizationConfig<any> {
    const data: VisualizationConfig<any> = {
      layout: Layout.HierarchicalUDDirected,
      title: Title,
      graph: {
        nodes: [],
        edges: []
      }
    };
    const existingNodes = new Set();
    const existingEdges = new Set();
    this.states.forEach(s => {
      const { graph } = s.getData();
      graph.nodes.forEach(n => {
        if (!existingNodes.has(n.id) && this.showSymbol(n.id)) {
          data.graph.nodes.push(n);
          existingNodes.add(n.id);
        }
      });
      graph.edges.forEach(e => {
        const edge = `${e.from}->${e.to}`;
        if (!existingEdges.has(edge) && this.showSymbol(edge)) {
          data.graph.edges.push(e);
          existingEdges.add(edge);
        }
      });
    });
    return data;
  }

  private showSymbol(id: string) {
    if (this.showLibs) {
      return true;
    }
    return id.indexOf('node_modules') < 0;
  }

  private init() {
    this.context.getModules().forEach(m => {
      this.states.push(new ModuleTreeState(this.context, m));
    });
    this.context.getModules().forEach(m => {
      this.states.push(new AppModuleState(this.context, m));
    });
    this.context.getDirectives().forEach(d => {
      this.states.push(new DirectiveState(this.context, d, false));
    });
    this.context.getProviders().forEach(p => {
      this.states.push(new ProviderState(this.context, p));
    });
    this.context.getPipes().forEach(p => {
      this.states.push(new PipeState(this.context, p));
    });
  }
}
