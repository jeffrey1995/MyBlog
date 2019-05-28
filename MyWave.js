import React from 'react';
import PropTypes from 'prop-types';
import {
    Dimensions, View, ART, Animated, Easing,
} from 'react-native';

const {
 Surface, Shape, Path,
} = ART;
const ScreenWidth = Dimensions.get('window').width;
const ScreenHeight = Dimensions.get('window').height;
const tempX1 = 45; // 波浪1的步长
const tempX2 = 50; // 波浪2的步长
const baseRatiio = 0.3; // 浪高比例

export default class MyWave extends React.Component {
    static propTypes = {
        waveHeight: PropTypes.number,
        waveWidth: PropTypes.number,
        wave1Color: PropTypes.string,
        wave2Color: PropTypes.string,
    };

    static defaultProps = {
        waveHeight: Math.ceil(ScreenHeight * 0.15),
        waveWidth: ScreenWidth,
        wave1Color: 'rgba(72,143,240,0.5)',
        wave2Color: 'rgba(72,143,240,0.5)',
    };

    state = {
        baseX1: new Animated.Value(0),
        baseX2: new Animated.Value(0),
        controlY: 25,
        startY: 0,
        up: true,
    };

    componentWillMount() {}

    componentDidMount() {
        this._changecontrolY();
        this._startAnimation1();
        this._startAnimation2();
    }

    // 让控制点的Y坐标动态变化
    _changecontrolY= () => {
        this.interval = setInterval(() => {
            const { controlY, startY, up } = this.state;

            let p = controlY;
            const y = startY;
            let up0 = up;

            if (up) {
                p = controlY + 0.5;
                up0 = p <= 25;
            } else {
                p = controlY - 0.5;
                up0 = p < 20;
            }
            this.setState({
                controlY: p,
                startY: y,
                up: up0,
            });
        }, 100);
    }

    _startAnimation1 = () => {
        const { baseX1: baseX } = this.state;

        baseX.setValue(-4 * tempX1);
        Animated.timing(baseX, {
            toValue: 0, // 目标值
            duration: 5000, // 动画时间
            easing: Easing.linear, // 缓动函数
        }).start(() => {
            this._startAnimation1();
        });
    };

    _startAnimation2 = () => {
        const { baseX2 } = this.state;

        baseX2.setValue(-4 * tempX2);
        Animated.timing(baseX2, {
            toValue: 0, // 目标值
            duration: 3500, // 动画时间
            easing: Easing.linear, // 缓动函数
        }).start(() => {
            this._startAnimation2();
        });
    };

    /**
     * 获取贝塞尔曲线路径
     */
    _getBezierPath= (temp, controlY) => {
        const { waveHeight } = this.props;
        const startX = -4 * temp;
        const startY = waveHeight * (1 - baseRatiio);
        const number = ScreenWidth / temp + 1;

        let speedStr = `M${startX} ${waveHeight} L${startX} ${startY}`;

        for (let i = 0; i <= number; i++) {
            speedStr += `Q${startX + (i * 4 + 1) * temp} ${startY
                - controlY}, ${startX + (i * 4 + 2) * temp} ${startY}`;
            speedStr += `Q${startX + (i * 4 + 3) * temp} ${startY
                + controlY}, ${startX + (i * 4 + 4) * temp} ${startY}`;
        }
        const path = new Path(speedStr);

        // 形成闭合区域
        path.lineTo(startX + (number * 4 + 4) * temp, waveHeight).close();

        return path;
    }

    render() {
        const {
            waveHeight, waveWidth, wave1Color, wave2Color,
        } = this.props;
        const { baseX1: baseX, baseX2, controlY } = this.state;
        const _path1 = this._getBezierPath(tempX1, controlY / 2);
        const _path2 = this._getBezierPath(tempX2, controlY);

        return (
          <View
            style={{
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: waveHeight,
                width:
                  waveWidth + 4 * tempX1 > tempX2 ? tempX1 : tempX2,
              }}
            >
              <Animated.View
                style={{
                  height: waveHeight,
                  width: waveWidth + 4 * tempX1,
                  position: 'absolute',
                  left: baseX,
                }}
              >
                <Surface
                  height={waveHeight}
                  width={waveWidth + 8 * tempX1}
                >
                  <Shape d={_path1} fill={wave1Color} />
                </Surface>
              </Animated.View>

              <Animated.View
                style={[
                  {
                    height: waveHeight,
                    width: waveWidth + 4 * tempX2,
                    position: 'absolute',
                    left: baseX2,
                  },
                ]}
              >
                <Surface
                  height={waveHeight}
                  width={waveWidth + 8 * tempX2}
                >
                  <Shape d={_path2} fill={wave2Color} />
                </Surface>
              </Animated.View>
            </View>
          </View>
        );
    }
}
