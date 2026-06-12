import ExpoModulesCore
import ExpoUI
import SwiftUI

struct InsightsBarSegment: Record {
  @Field var label: String = ""
  @Field var value: Double = 0
  @Field var color: Color = .blue
}

public final class InsightsBreakdownBarProps: UIBaseViewProps {
  @Field var segments: [InsightsBarSegment] = []
  @Field var barHeight: Double = 14
  @Field var spacing: Double = 3
  @Field var animate: Bool = true
}

public struct InsightsBreakdownBarView: ExpoSwiftUI.View {
  @ObservedObject public var props: InsightsBreakdownBarProps
  @State private var appeared = false

  public init(props: InsightsBreakdownBarProps) {
    self.props = props
  }

  private var total: Double {
    max(props.segments.reduce(0) { $0 + max($1.value, 0) }, 0.0001)
  }

  public var body: some View {
    GeometryReader { geometry in
      let visible = props.segments.filter { $0.value > 0 }
      let gaps = props.spacing * Double(max(visible.count - 1, 0))
      let available = max(geometry.size.width - gaps, 0)
      HStack(spacing: props.spacing) {
        ForEach(Array(visible.enumerated()), id: \.offset) { _, segment in
          Capsule()
            .fill(segment.color)
            .frame(width: appeared ? max(available * (segment.value / total), props.barHeight / 2) : 0)
        }
      }
      .frame(height: props.barHeight)
      .frame(maxHeight: .infinity, alignment: .center)
    }
    .onAppear {
      if props.animate {
        withAnimation(.spring(response: 0.6, dampingFraction: 0.9)) { appeared = true }
      } else {
        appeared = true
      }
    }
  }
}
