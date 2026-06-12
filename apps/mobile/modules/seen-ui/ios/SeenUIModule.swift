import ExpoModulesCore
import ExpoUI

public class SeenUIModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SeenUI")

    ExpoUIView(InsightsLineChartView.self)
    ExpoUIView(InsightsRingView.self)
    ExpoUIView(InsightsDonutView.self)
    ExpoUIView(InsightsBreakdownBarView.self)

    OnCreate {
      ViewModifierRegistry.register("seenSymbolReplaceTransition") { params, appContext, _ in
        return try SymbolReplaceTransitionModifier(from: params, appContext: appContext)
      }
    }

    OnDestroy {
      ViewModifierRegistry.unregister("seenSymbolReplaceTransition")
    }
  }
}
