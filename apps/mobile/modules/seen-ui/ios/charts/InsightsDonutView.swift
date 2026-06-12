import Charts
import ExpoModulesCore
import ExpoUI
import SwiftUI

struct InsightsDonutSegment: Record {
  @Field var label: String = ""
  @Field var value: Double = 0
  @Field var color: Color = .blue
}

public final class InsightsDonutProps: UIBaseViewProps {
  @Field var segments: [InsightsDonutSegment] = []
  @Field var innerRadiusRatio: Double = 0.62
  @Field var angularInset: Double = 1.5
  @Field var animate: Bool = true
}

public struct InsightsDonutView: ExpoSwiftUI.View {
  @ObservedObject public var props: InsightsDonutProps

  public init(props: InsightsDonutProps) {
    self.props = props
  }

  private var total: Double {
    max(props.segments.reduce(0) { $0 + max($1.value, 0) }, 0.0001)
  }

  public var body: some View {
    if #available(iOS 17.0, tvOS 17.0, *) {
      Chart {
        ForEach(Array(props.segments.enumerated()), id: \.offset) { _, segment in
          SectorMark(
            angle: .value("Value", max(segment.value, 0)),
            innerRadius: .ratio(props.innerRadiusRatio),
            angularInset: props.angularInset
          )
          .foregroundStyle(segment.color)
          .cornerRadius(3)
        }
      }
      .chartLegend(.hidden)
    } else {
      fallbackDonut
    }
  }

  // iOS 16.4 floor has no SectorMark; draw trimmed stroked circles instead.
  private var fallbackDonut: some View {
    GeometryReader { geometry in
      let size = min(geometry.size.width, geometry.size.height)
      let lineWidth = size * (1 - props.innerRadiusRatio) / 2
      let radiusPadding = lineWidth / 2
      let fractions = props.segments.map { max($0.value, 0) / total }
      let starts = fractions.reduce(into: [Double]()) { acc, fraction in
        acc.append((acc.last ?? 0) + fraction)
      }
      ZStack {
        ForEach(Array(props.segments.enumerated()), id: \.offset) { index, segment in
          let start = index == 0 ? 0 : starts[index - 1]
          Circle()
            .trim(from: start + 0.004, to: starts[index] - 0.004)
            .stroke(segment.color, style: StrokeStyle(lineWidth: lineWidth))
            .rotationEffect(.degrees(-90))
            .padding(radiusPadding)
        }
      }
      .frame(width: size, height: size, alignment: .center)
      .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
  }
}
